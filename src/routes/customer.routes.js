import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { customerSendOtp, customerVerifyLogin } from "../controllers/auth.controller.js";

const router = Router();

// Customer Routes
router.post("/send-otp", customerSendOtp);
router.post("/verify-login", customerVerifyLogin);

// Protect all subsequent customer routes
router.use(verifyJWT, verifyRole("customer"));

export default router;