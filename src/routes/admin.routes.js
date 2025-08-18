import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { adminLogin } from "../controllers/auth.controller.js";

const router = Router();

// Admin login route
router.post("/login", adminLogin);

// Protect all subsequent admin routes
router.use(verifyJWT, verifyRole("admin"));


export default router;