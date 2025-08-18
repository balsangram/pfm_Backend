import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { managerSendOtp, managerVerifyLogin } from "../controllers/auth.controller.js";

const router = Router();
// Manager routes
router.post("/send-otp", managerSendOtp);
router.post("/verify-login", managerVerifyLogin);

// Protect all subsequent manager routes
router.use(verifyJWT, verifyRole("manager"));

export default router;