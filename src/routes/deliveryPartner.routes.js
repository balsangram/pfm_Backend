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
    getAssignedOrders
} from "../controllers/deliveryPartner/deliveryPartner.controller.js";

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

export default router