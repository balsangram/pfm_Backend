import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { customerSendOtp, customerVerifyLogin, customerRefreshToken } from "../controllers/auth.controller.js";
import { customerCategoriesController } from "../controllers/customer/categories.controller.js";

const router = Router();

// Customer authentication routes (OTP-based)
router.post("/send-otp", customerSendOtp);
router.post("/verify-login", customerVerifyLogin);

// Customer refresh token route
router.post("/refresh-token", customerRefreshToken);


// Protect all subsequent customer routes
router.use(verifyJWT, verifyRole("customer"));

// profile 
router.get("/profile",);
router.patch("/update-profile",);
router.delete("/delete-account",);
router.post("/logout",);
router.get("/address",);
router.get("/orders",);
router.post("/cancel-order",);
router.get("/wallet",);
router.get("/notifications",);
router.get("/contact-us",);
router.delete("/delete-account",);

// cart 
router.get("/cart",);
router.post("/add-to-cart",);
router.delete("/remove-from-cart",);

// wishlist
router.get("/allCategories", customerCategoriesController.allCategories);
// router.get("/bestSellingProducts", bestSellingProducts);

router.get("/allCategories-subProducts/:id", customerCategoriesController.allCategoriesSubProducts);

router.post("/search-subProducts",);

export default router;