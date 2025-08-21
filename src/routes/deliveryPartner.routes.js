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

const router = Router()

// Delivery Partner authentication routes (OTP-based)
router.post("/send-otp", deliveryPartnerSendOtp);
router.post("/verify-login", deliveryPartnerVerifyLogin);

// Delivery Partner refresh token route
router.post("/refresh-token", deliveryPartnerRefreshToken);

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
router.post("/respond-order", validateRequest(respondOrderValidation), respondToOrder);

// Delivery flow
router.post("/initiate-delivery", validateRequest(initiateDeliveryValidation), initiateDelivery);
router.post("/mark-delivered", validateRequest(markDeliveredValidation), markOrderDelivered);
router.post("/reject-delivery", validateRequest(rejectDeliveryValidation), rejectDelivery);

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