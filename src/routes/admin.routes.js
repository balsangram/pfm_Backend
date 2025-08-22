import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { validateRequest, validateMultiple } from "../middlewares/validation.middleware.js";
import { adminLogin, adminRefreshToken } from "../controllers/auth.controller.js";
import { AdminProfileController } from "../controllers/admin/adminProfile.controller.js";
import { MeatCenterController } from "../controllers/admin/meatCenter.controller.js";
import { DeliveryPartnerController } from "../controllers/admin/deliveryPartner.controller.js";
import { SendNotificationController } from "../controllers/admin/sendNotification.controller.js";
import { ProductCategoryController } from "../controllers/admin/productCategories.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import {
    createMeatCenterSchema,
    updateMeatCenterSchema,
    idParamSchema,
    productCategorySchemaAdd,
    productCategorySchemaEdit,
    subCategorySchemaEdit,
    subProductCategorySchemaAdd,
    typeCategorySchemaAdd,
    typeCategorySchemaEdit
} from "../validations/admin.validation.js";
import { couponsController } from "../controllers/admin/coupons.controller.js";
// import { contactUsController } from "../controllers/admin/contactUs.controller.js";
import { contactUsController } from "../controllers/admin/contactUs.controller.js";
// import { contactUsController } from "../controllers/admin/contactUS.controller.js";

// import { contactUsController } from "../controllers/admin/contactUS.controller.js";

const router = Router();

// Admin login route
router.post("/login", adminLogin);

// Admin refresh token route
router.post("/refresh-token", adminRefreshToken);

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
router.get("/delivery-partners", DeliveryPartnerController.getAllDeliveryPartners);
router.get("/delivery-partners/:id", DeliveryPartnerController.getDeliveryPartnerById);
router.post("/delivery-partners", DeliveryPartnerController.createDeliveryPartner);
router.patch("/delivery-partners/:id", DeliveryPartnerController.updateDeliveryPartnerStatus);
router.delete("/delivery-partners/:id", DeliveryPartnerController.deleteDeliveryPartner);

// Send Notification
router.post("/send-notification", SendNotificationController.sendNotification);

// Product Categories
router.get("/product-categories", ProductCategoryController.getProductCategories);
router.post("/product-categories", upload.any(), validateRequest(productCategorySchemaAdd), ProductCategoryController.createProductCategory);
router.patch("/product-categories/:id", upload.any(), validateMultiple(productCategorySchemaEdit), ProductCategoryController.updateProductCategory);
router.delete("/product-categories/:id", ProductCategoryController.deleteProductCategory);

// Type Category
router.get("/type-categories/:id", ProductCategoryController.getTypeCategories);
router.post("/type-categories/:id", upload.any(), validateRequest(typeCategorySchemaAdd), ProductCategoryController.createTypeCategory);
router.patch("/type-categories/:id", upload.any(), validateMultiple(typeCategorySchemaEdit), ProductCategoryController.updateTypeCategory);
router.delete("/type-categories/:id/product-categories/:categoryId", ProductCategoryController.deleteTypeCategory);

// Product Categories - Subcategories
router.get("/sub-product-categories/:id",
    ProductCategoryController.getSubProductCategories);
router.post(
    "/sub-product-categories/:id", upload.any(),
    validateMultiple(subProductCategorySchemaAdd),
    ProductCategoryController.createSubProductCategory);
router.patch(
    "/sub-product-categories/:id", upload.any(),
    validateMultiple(subCategorySchemaEdit),
    ProductCategoryController.updateSubProductCategory
);
router.delete(
    "/sub-product-categories/:id/type-categories/:categoryId",
    ProductCategoryController.deleteSubProductCategory
);

router.get("/sub-product-categories-details/:id", ProductCategoryController.getAllDetailsOfSubCategoriesProduct);

// coupons 

router.get("/coupons", couponsController.displayCoupons)
router.post("/coupons", couponsController.addCoupons)
router.patch("/coupons/:id", couponsController.editCoupons)
router.delete("/coupons/:id", couponsController.deleteCoupons)

// contactUs

// Get all contact entries
router.get("/contact-us", contactUsController.getAllContacts);
// Add a new contact entry
router.post("/contact-us", contactUsController.addContact);
// Update a contact entry by ID
router.patch("/contact-us/:id", contactUsController.updateContact);
// Delete a contact entry by ID
router.delete("/contact-us/:id", contactUsController.deleteContact);

export default router;