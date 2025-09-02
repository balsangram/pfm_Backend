import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { customerSendOtp, customerVerifyLogin, customerRefreshToken } from "../controllers/auth.controller.js";
import { customerCategoriesController } from "../controllers/customer/categories.controller.js";
import { customerCartController } from "../controllers/customer/customerCart.controller.js";
import { customerProfileController } from "../controllers/customer/customerProfile.controller.js";
import { customerCouponsController } from "../controllers/customer/coupons.controller.js";
import { createOrder, reOrder } from "../controllers/customer/order.controller.js";
import { noteficationControl } from "../controllers/customer/notefication.controller.js";
import subCategorySchemaModel from "../models/catalog/subCategorySchema.model.js";

const router = Router();

// Customer authentication routes (OTP-based)
router.post("/send-otp", customerSendOtp);
router.post("/verify-login", customerVerifyLogin);

// Customer refresh token route
router.post("/refresh-token", customerRefreshToken);

// Protect all subsequent customer routes
router.use(verifyJWT, verifyRole("customer"));

// profile 
router.get("/profile/:userId", customerProfileController.customerProfile);
router.patch("/update-profile/:userId", customerProfileController.updateProfile);
router.delete("/delete-account/:userId", customerProfileController.deleteCustomer);
router.post("/logout/:userId", customerProfileController.customerLogout);
router.get("/contact-us", customerProfileController.getContacts);

router.get("/address/:userId", customerProfileController.displayAddress);
router.post("/address/:userId", customerProfileController.addAddress);
router.patch("/address/:userId/:addressId", customerProfileController.editAddress);
router.delete("/address/:userId/:addressId", customerProfileController.deleteAddress);

router.get("/wallet/:userId", customerCouponsController.displayWalletPoint);

router.get("/coupons/:userId", customerCouponsController.displayCoupons);
router.post("/use-coupons/:userId", customerCouponsController.addCouponToUser);

// cart 
router.get("/cart/:userId", customerCartController.displayCartDetails);         // View cart
router.post("/cart/:userId", customerCartController.addToCart);                 // Add item
router.patch("/cart/:userId/item/:itemId", customerCartController.editToCart);  // Update qty
router.delete("/cart/:userId/item/:itemId", customerCartController.deleteToCart); // Remove item

router.get("/cart-details/:userId", customerCartController.totalProductAmount); // Remove item

//order related
router.get("/order-history/:userId", customerCartController.orderHistory);
router.delete("/delete-order-history/:orderId", customerCartController.deleteHistoryOrder)
router.post("/create-order/:userId", createOrder);
router.post("/re-order/:userId/order/:orderId", reOrder)
router.post("/cancel-order/:userId/:orderId", customerCartController.cancelOrder);
router.get("/order-status/:orderId", customerCartController.orderStatusDisplay);
router.get("/order-details/:orderId", customerCartController.orderDetails);

// wishlist
// 1. display all categories cards ===
router.get("/allCategories", customerCategoriesController.allCategories);
// router.get("/allCategories", customerCategoriesController.allCategoriesWithCount);

// 2. display all bestSelling products ===
router.get("/bestSellingProducts", customerCategoriesController.bestSellingProducts);
router.get("/bestSellingProducts/user/:userId", customerCategoriesController.bestSellingProductsById);

// 3. in category under how many sub category cards are here all display
router.get("/allCategories-subProducts/:id", customerCategoriesController.allCategoriesSubProducts);

// 4. all categoris name with typeCategories cards detaisl display 
router.get("/categories-types", customerCategoriesController.categoriesTypes);

// 5. based on type card display sub categori cards  
router.get("/type-categories-all-card/:id", customerCategoriesController.typeCategoriesAllCard)

// 6. display full details of sub categorie card 
router.get("/full-details-of-sub-categorie-card/:id", customerCategoriesController.fullDetailsOfSubCategorieCard)

// display all subCategory
router.get("/display-all-subcategory", customerCategoriesController.displayAllSubCategory)

router.get("/search-item", customerCategoriesController.searchItem);
router.get("/allCategories-search-bottom", customerCategoriesController.allSubCategories_bottom_search);

// notefication 
router.get("/get-notefication/:userId", noteficationControl.displayUserNoteficatio);


export default router;