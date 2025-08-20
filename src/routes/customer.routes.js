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
// 1. display all categories cards ===
router.get("/allCategories", customerCategoriesController.allCategories);

// 2. display all bestSelling products ===
// router.get("/bestSellingProducts", bestSellingProducts);

// 3. in category under how many sub category cards are here all display
router.get("/allCategories-subProducts/:id", customerCategoriesController.allCategoriesSubProducts);

// 4. all categoris name with typeCategories cards detaisl display 
router.get("/categories-types", customerCategoriesController.categoriesTypes);

// 5. based on type card display sub categori cards  
router.get("/type-categories-all-card/:id", customerCategoriesController.typeCategoriesAllCard)

// 6. display full details of sub categorie card 
router.get("/full-details-of-sub-categorie-card/:id", customerCategoriesController.fullDetailsOfSubCategorieCard)

router.post("/search-subProducts",);

export default router;