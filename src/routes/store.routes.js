import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { storeSendOtp, storeVerifyLogin, storeRefreshToken } from "../controllers/auth.controller.js";

const router = Router();

// Store authentication routes (OTP-based)
router.post("/send-otp", storeSendOtp);
router.post("/verify-login", storeVerifyLogin);

// Store refresh token route
router.post("/refresh-token", storeRefreshToken);

// Protect all subsequent store routes
router.use(verifyJWT, verifyRole("store"));

export default router;