import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { deliveryPartnerSendOtp, deliveryPartnerVerifyLogin, deliveryPartnerRefreshToken } from "../controllers/auth.controller.js";
import {
    getDeliveryPartnerProfile,
    updateDeliveryPartnerProfile,
    getDocumentStatus,
    uploadDocument,
    getDeliveryStatistics,
    updateLastActive,
    getAssignedOrders,
    scanOrderQr,
    respondToOrder,
    initiateDelivery,
    markOrderDelivered,
    rejectDelivery,
    getOngoingOrders,
    getCompletedOrders,
    getStoreManagerContact,
    getProfileInfo,
    deleteAccount,
    getProfileStats,
    editProfile
} from "../controllers/deliveryPartner/deliveryPartner.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
    scanQrValidation,
    respondOrderValidation,
    initiateDeliveryValidation,
    markDeliveredValidation,
    rejectDeliveryValidation,
    editProfileValidation
} from "../validations/deliveryPartner.validation.js";

// Debug: Log imported validation schemas
console.log('🔍 DeliveryPartner Routes - Imported validation schemas:', {
    scanQrValidation: !!scanQrValidation,
    respondOrderValidation: !!respondOrderValidation,
    initiateDeliveryValidation: !!initiateDeliveryValidation,
    markDeliveredValidation: !!markDeliveredValidation,
    rejectDeliveryValidation: !!rejectDeliveryValidation,
    editProfileValidation: !!editProfileValidation
});

const router = Router()

// Helper middleware: normalize orderId from body/query/params and alternate keys
const normalizeOrderId = (req, res, next) => {
    console.log('🔍 normalizeOrderId: Starting normalization...');
    console.log('🔍 normalizeOrderId: Original body:', req.body);
    console.log('🔍 normalizeOrderId: Original query:', req.query);
    console.log('🔍 normalizeOrderId: Original params:', req.params);
    console.log('🔍 normalizeOrderId: Content-Type:', req.get('Content-Type'));
    
    const candidates = [
        req.body?.orderId,
        req.body?.id,
        req.body?.orderID,
        req.query?.orderId,
        req.query?.id,
        req.query?.orderID,
        req.params?.orderId,
        req.params?.id,
        req.params?.orderID,
    ];
    
    console.log('🔍 normalizeOrderId: Candidates found:', candidates);
    const found = candidates.find(Boolean);
    console.log('🔍 normalizeOrderId: Selected value:', found);
    
    if (!req.body) req.body = {};
    if (found && !req.body.orderId) {
        req.body.orderId = String(found);
        console.log('🔍 normalizeOrderId: Set orderId in body:', req.body.orderId);
    }
    
    console.log('🔍 normalizeOrderId: Final body:', req.body);
    console.log('🔍 normalizeOrderId: Body keys:', Object.keys(req.body));
    next();
};

// Delivery Partner authentication routes (OTP-based)
router.post("/send-otp", deliveryPartnerSendOtp);
router.post("/verify-login", deliveryPartnerVerifyLogin);

// Delivery Partner refresh token route
router.post("/refresh-token", deliveryPartnerRefreshToken);

// Debug endpoint - test authentication
router.get("/test-auth", verifyJWT, (req, res) => {
    console.log('🔍 Test endpoint hit - Auth details:', {
        user: req.user ? { id: req.user._id, role: req.userRole } : 'No user',
        headers: req.headers,
        userRole: req.userRole
    });
    res.json({
        success: true,
        message: "Authentication test successful",
        user: req.user ? { id: req.user._id, role: req.userRole } : null,
        headers: req.headers
    });
});

// Debug endpoint - test request body parsing
router.post("/test-body", verifyJWT, (req, res) => {
    console.log('🔍 Test body endpoint hit - Request details:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : 'No body',
        contentType: req.get('Content-Type'),
        user: req.user ? { id: req.user._id, role: req.userRole } : 'No user'
    });
    
    res.json({
        success: true,
        message: "Body parsing test successful",
        receivedBody: req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : 'No body',
        contentType: req.get('Content-Type'),
        user: req.user ? { id: req.user._id, role: req.userRole } : null
    });
});

// Debug endpoint - test validation middleware
router.post("/test-validation", verifyJWT, validateRequest(initiateDeliveryValidation), (req, res) => {
    console.log('🔍 Test validation endpoint hit - Validation passed!');
    res.json({
        success: true,
        message: "Validation test successful",
        validatedData: req.body,
        user: req.user ? { id: req.user._id, role: req.userRole } : null
    });
});

// Debug endpoint - test without validation (raw request)
router.post("/test-raw", verifyJWT, (req, res) => {
    console.log('🔍 Test raw endpoint hit - No validation!');
    res.json({
        success: true,
        message: "Raw request test successful",
        rawBody: req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : 'No body',
        contentType: req.get('Content-Type'),
        user: req.user ? { id: req.user._id, role: req.userRole } : null
    });
});

// Debug endpoint - test with normalization only
router.post("/test-normalize", verifyJWT, normalizeOrderId, (req, res) => {
    console.log('🔍 Test normalize endpoint hit - After normalization!');
    res.json({
        success: true,
        message: "Normalization test successful",
        originalBody: req.body,
        normalizedBody: req.body,
        bodyKeys: req.body ? Object.keys(req.body) : 'No body',
        hasOrderId: !!req.body.orderId,
        orderIdValue: req.body.orderId,
        user: req.user ? { id: req.user._id, role: req.userRole } : null
    });
});

// Protected routes (require authentication)
router.use(verifyJWT, verifyRole("deliveryPartner"));

// Profile management
router.get("/profile", getDeliveryPartnerProfile);
router.put("/profile", updateDeliveryPartnerProfile);

// Document verification
router.get("/documents/status", getDocumentStatus);
router.post("/documents/upload", uploadDocument);

// Delivery operations
router.get("/statistics", getDeliveryStatistics);
router.put("/last-active", updateLastActive);
router.get("/orders", getAssignedOrders);

// QR flow
router.post("/scan-qr", validateRequest(scanQrValidation), scanOrderQr);
router.post("/respond-order", normalizeOrderId, validateRequest(respondOrderValidation), respondToOrder);

// Delivery flow
router.post("/initiate-delivery", normalizeOrderId, validateRequest(initiateDeliveryValidation), initiateDelivery);
router.post("/mark-delivered", normalizeOrderId, validateRequest(markDeliveredValidation), markOrderDelivered);
router.post("/reject-delivery", normalizeOrderId, validateRequest(rejectDeliveryValidation), rejectDelivery);

// Debug: Log the validation schemas being used
console.log('🔍 DeliveryPartner Routes - Validation schemas details:', {
    initiateDeliveryValidation: {
        exists: !!initiateDeliveryValidation,
        type: typeof initiateDeliveryValidation,
        hasValidate: initiateDeliveryValidation && typeof initiateDeliveryValidation.validate === 'function',
        schema: initiateDeliveryValidation ? 'Schema loaded' : 'No schema'
    }
});

// Order management
router.get("/ongoing-orders", getOngoingOrders);
router.get("/completed-orders", getCompletedOrders);

// Profile section
router.get("/profile/info", getProfileInfo);
router.get("/profile/stats", getProfileStats);
router.get("/contact-us", getStoreManagerContact);
router.patch("/profile/edit", validateRequest(editProfileValidation), editProfile);
router.delete("/profile", deleteAccount);

export default router