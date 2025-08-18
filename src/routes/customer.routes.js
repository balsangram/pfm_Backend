import { Router } from "express";
import { customerSendOtp, customerVerifyLogin } from "../controllers/auth.controller.js";

const router = Router();

// Customer Routes
router.post("/send-otp", customerSendOtp);
router.post("/verify-login", customerVerifyLogin);

export default router;