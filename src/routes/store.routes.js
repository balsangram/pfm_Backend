import { Router } from "express";
import { storeSendOtp, storeVerifyLogin } from "../controllers/auth.controller.js";

const router = Router();

router.post("/send-otp", storeSendOtp);
router.post("/verify-login", storeVerifyLogin);

export default router;