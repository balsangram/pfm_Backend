import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { storeSendOtp, storeVerifyLogin, storeRefreshToken } from "../controllers/auth.controller.js";
import { getStoreLiveOrders } from "../controllers/store/liveOrders.controller.js";

const router = Router();

// Store authentication routes (OTP-based)
router.post("/send-otp", storeSendOtp);
router.post("/verify-login", storeVerifyLogin);

// Store refresh token route
router.post("/refresh-token", storeRefreshToken);

// Protect all subsequent store routes
router.use(verifyJWT, verifyRole("store"));

// Live orders for store TV screen
router.get("/orders", getStoreLiveOrders);

export default router;