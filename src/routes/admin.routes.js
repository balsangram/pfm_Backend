import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { adminLogin } from "../controllers/auth.controller.js";
import { AdminProfileController } from "../controllers/admin/adminProfile.controller.js";
import { MeatCenterController } from "../controllers/admin/meatCenter.controller.js";
import { DeliveryPartnerController } from "../controllers/admin/deliveryPartner.controller.js";
import { SendNotificationController } from "../controllers/admin/sendNotification.controller.js";
import { ProductCategoryController } from "../controllers/admin/productCategories.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { validateMultiple, validateRequest } from "../middlewares/validation.middleware.js";
import { productCategorySchemaAdd, productCategorySchemaEdit, subCategorySchemaEdit } from "../validations/admin.validation.js";

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
router.post("/product-categories", upload.any(), validateRequest(productCategorySchemaAdd), ProductCategoryController.createProductCategory);
router.patch("/product-categories/:id", upload.any(), validateMultiple(productCategorySchemaEdit), ProductCategoryController.updateProductCategory);
router.delete("/product-categories/:id", ProductCategoryController.deleteProductCategory);

// Product Categories - Subcategories
router.get("/sub-product-categories/:id",
    ProductCategoryController.getSubProductCategories);

router.post(
    "/sub-product-categories/:id", upload.any(),
    validateMultiple(productCategorySchemaAdd),
    ProductCategoryController.createSubProductCategory);

router.patch(
    "/sub-product-categories/:id", upload.any(),
    validateMultiple(subCategorySchemaEdit),
    ProductCategoryController.updateSubProductCategory
);

router.delete(
    "/product-categories/:id/sub-product-categories/:subId",
    ProductCategoryController.deleteSubProductCategory
);


export default router;