import { Router } from "express";
import { deliveryPartnerSendOtp, deliveryPartnerVerifyLogin } from "../controllers/auth.controller.js";

const router = Router()
// Delivery Partner routes
router.post("/send-otp", deliveryPartnerSendOtp);
router.post("/verify-login", deliveryPartnerVerifyLogin);

export default router