import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { storeSendOtp, storeVerifyLogin } from "../controllers/auth.controller.js";

const router = Router();

router.post("/send-otp", storeSendOtp);
router.post("/verify-login", storeVerifyLogin);

// Protect all subsequent store routes
router.use(verifyJWT, verifyRole("store"));

export default router;