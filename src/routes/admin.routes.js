import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { adminLogin } from "../controllers/auth.controller.js";
import { AdminProfileController } from "../controllers/admin/adminProfile.controller.js";
import { MeatCenterController } from "../controllers/admin/meatCenter.controller.js";
import { DeliveryPartnerController } from "../controllers/admin/deliveryPartner.controller.js";
import { SendNotificationController } from "../controllers/admin/sendNotification.controller.js";
import { ProductCategoryController } from "../controllers/admin/productCategories.controller.js";

const router = Router();

// Admin login route
router.post("/login", adminLogin);

// Protect all subsequent admin routes
router.use(verifyJWT, verifyRole("admin"));

router.get("/profile", AdminProfileController.adminProfile);
router.patch("/update-profile", AdminProfileController.adminUpdateProfile);
router.delete("/delete-account", AdminProfileController.adminDeleteAccount);
router.patch("/change-password", AdminProfileController.adminChangePassword);
router.post("/logout", AdminProfileController.adminLogout);

// Meat Center
router.get("/meat-centers", MeatCenterController.getMeatCenters);
router.post("/meat-centers", MeatCenterController.createMeatCenter);
router.patch("/meat-centers/:id", MeatCenterController.updateMeatCenter);
router.delete("/meat-centers/:id", MeatCenterController.deleteMeatCenter);

// Delivery Partner
router.get("/delivery-partners", DeliveryPartnerController.getDeliveryPartners);
router.post("/delivery-partners", DeliveryPartnerController.createDeliveryPartner);
router.patch("/delivery-partners/:id", DeliveryPartnerController.updateDeliveryPartner);
router.delete("/delivery-partners/:id", DeliveryPartnerController.deleteDeliveryPartner);

// Send Notification
router.post("/send-notification", SendNotificationController.sendNotification);

// Product Categories
router.get("/product-categories", ProductCategoryController.getProductCategories);
router.post("/product-categories", ProductCategoryController.createProductCategory);
router.patch("/product-categories/:id", ProductCategoryController.updateProductCategory);
router.delete("/product-categories/:id", ProductCategoryController.deleteProductCategory);

export default router;