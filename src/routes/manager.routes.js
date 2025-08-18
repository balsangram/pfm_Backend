import { Router } from "express";
import { managerSendOtp, managerVerifyLogin } from "../controllers/auth.controller.js";

const router = Router();
// Manager routes
router.post("/send-otp", managerSendOtp);
router.post("/verify-login", managerVerifyLogin);

export default router;