import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { managerSendOtp, managerVerifyLogin, managerRefreshToken } from "../controllers/auth.controller.js";
import {
    getManagerProfile,
    updateManagerProfile,
    changeManagerPassword,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getDeliveryPartners,
    createDeliveryPartner,
    updateDeliveryPartner,
    deleteDeliveryPartner,
    getStoreDetails,
    updateStoreDetails,
    getDashboardStats
} from "../controllers/manager/manager.controller.js";
import {
    getLiveOrders,
    getOrdersByStatus,
    getUrgentOrders,
    getOrderCounts
} from "../controllers/manager/liveOrders.controller.js";
import {
    managerSendOtpSchema,
    managerVerifyLoginSchema,
    updateProfileSchema,
    changePasswordSchema,
    updateOrderStatusSchema,
    orderFilterSchema,
    createDeliveryPartnerSchema,
    updateDeliveryPartnerSchema,
    updateStoreSchema,
    idParamSchema
} from "../validations/manager.validation.js";

const router = Router();

// Manager authentication routes (OTP-based)
router.post("/send-otp", 
    validateRequest(managerSendOtpSchema, 'body'),
    managerSendOtp
);
router.post("/verify-login", 
    validateRequest(managerVerifyLoginSchema, 'body'),
    managerVerifyLogin
);

// Manager refresh token route
router.post("/refresh-token", managerRefreshToken);

// Protect all subsequent manager routes
router.use(verifyJWT, verifyRole("manager"));

// Manager Profile Management
router.get("/profile", getManagerProfile);
router.patch("/update-profile", 
    validateRequest(updateProfileSchema, 'body'),
    updateManagerProfile
);
router.patch("/change-password", 
    validateRequest(changePasswordSchema, 'body'),
    changeManagerPassword
);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Live Orders for TV Screen
router.get("/live-orders", getLiveOrders);
router.get("/live-orders/status/:status", 
    validateRequest(idParamSchema, 'params'),
    getOrdersByStatus
);
router.get("/live-orders/urgent", getUrgentOrders);
router.get("/live-orders/counts", getOrderCounts);

// Order Management
router.get("/orders", 
    validateRequest(orderFilterSchema, 'query'),
    getOrders
);
router.get("/orders/:id", 
    validateRequest(idParamSchema, 'params'),
    getOrderById
);
router.patch("/orders/:id/status", 
    validateRequest(idParamSchema, 'params'),
    validateRequest(updateOrderStatusSchema, 'body'),
    updateOrderStatus
);

// Delivery Partner Management
router.get("/delivery-partners", 
    validateRequest(orderFilterSchema, 'query'), // Reusing orderFilterSchema for pagination
    getDeliveryPartners
);
router.post("/delivery-partners", 
    validateRequest(createDeliveryPartnerSchema, 'body'),
    createDeliveryPartner
);
router.patch("/delivery-partners/:id", 
    validateRequest(idParamSchema, 'params'),
    validateRequest(updateDeliveryPartnerSchema, 'body'),
    updateDeliveryPartner
);
router.delete("/delivery-partners/:id", 
    validateRequest(idParamSchema, 'params'),
    deleteDeliveryPartner
);

// Store Management
router.get("/store", getStoreDetails);
router.patch("/store", 
    validateRequest(updateStoreSchema, 'body'),
    updateStoreDetails
);

export default router;