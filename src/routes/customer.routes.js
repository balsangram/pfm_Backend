import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { customerSendOtp, customerVerifyLogin, customerRefreshToken } from "../controllers/auth.controller.js";
import { customerCategoriesController } from "../controllers/customer/categories.controller.js";
import { customerCartController } from "../controllers/customer/customerCart.controller.js";
import { customerProfileController } from "../controllers/customer/customerProfile.controller.js";
import { customerCouponsController } from "../controllers/customer/coupons.controller.js";

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
router.post("/use-coupons/:userId/:couponId", customerCouponsController.addCouponToUser);

// cart 
router.get("/cart/:userId", customerCartController.displayCartDetails);         // View cart
router.post("/cart/:userId", customerCartController.addToCart);                 // Add item
router.patch("/cart/:userId/item/:itemId", customerCartController.editToCart);  // Update qty
router.delete("/cart/:userId/item/:itemId", customerCartController.deleteToCart); // Remove item

router.get("/cart-details/:userId", customerCartController.totalProductAmount); // Remove item

//order related
router.get("/order-history/:userId", customerCartController.orderHistory);
router.post("/create-order/:userId", customerCartController.createOrder);
router.delete("/cancel-order/:userId/:orderId", customerCartController.cancelOrder);

// wishlist
// 1. display all categories cards ===
router.get("/allCategories", customerCategoriesController.allCategories);

// 2. display all bestSelling products ===
router.get("/bestSellingProducts", customerCategoriesController.bestSellingProducts);

// 3. in category under how many sub category cards are here all display
router.get("/allCategories-subProducts/:id", customerCategoriesController.allCategoriesSubProducts);

// 4. all categoris name with typeCategories cards detaisl display 
router.get("/categories-types", customerCategoriesController.categoriesTypes);

// 5. based on type card display sub categori cards  
router.get("/type-categories-all-card/:id", customerCategoriesController.typeCategoriesAllCard)

// 6. display full details of sub categorie card 
router.get("/full-details-of-sub-categorie-card/:id", customerCategoriesController.fullDetailsOfSubCategorieCard)

router.get("/search-item", customerCategoriesController.searchItem);
router.get("/allCategories-search-bottom", customerCategoriesController.allSubCategories_bottom_search);

export default router;