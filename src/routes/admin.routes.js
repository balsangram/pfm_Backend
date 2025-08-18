import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { adminLogin } from "../controllers/auth.controller.js";

const router = Router();

// Admin login route
router.post("/login", adminLogin);

// Protect all subsequent admin routes
router.use(verifyJWT, verifyRole("admin"));

// router.get("/profile", adminProfile);
// router.patch("/update-profile", adminUpdateProfile);
// router.delete("/delete-account", adminDeleteAccount);
// router.patch("/change-password", adminChangePassword);
// router.post("/logout", adminLogout);

// // Meat Center
// router.get("/meat-centers", getMeatCenters);
// router.post("/meat-centers", createMeatCenter);
// router.patch("/meat-centers/:id", updateMeatCenter);
// router.delete("/meat-centers/:id", deleteMeatCenter);

// // Delivery Partner
// router.get("/delivery-partners", getDeliveryPartners);
// router.post("/delivery-partners", createDeliveryPartner);
// router.patch("/delivery-partners/:id", updateDeliveryPartner);
// router.delete("/delivery-partners/:id", deleteDeliveryPartner);

// // Send Notification
// router.post("/send-notification", sendNotification);

// // Product Categories
// router.get("/product-categories", getProductCategories);
// router.post("/product-categories", createProductCategory);
// router.patch("/product-categories/:id", updateProductCategory);
// router.delete("/product-categories/:id", deleteProductCategory);

export default router;