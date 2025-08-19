import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { deliveryPartnerSendOtp, deliveryPartnerVerifyLogin } from "../controllers/auth.controller.js";

const router = Router()
// Delivery Partner routes
router.post("/send-otp", deliveryPartnerSendOtp);
router.post("/verify-login", deliveryPartnerVerifyLogin);

// Protect all subsequent delivery partner routes
router.use(verifyJWT, verifyRole("deliveryPartner"));



export default router