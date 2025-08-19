import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { managerSendOtp, managerVerifyLogin } from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
    updateProfileSchema,
    changePasswordSchema,
    createDeliveryPartnerSchema,
    updateDeliveryPartnerSchema,
    updateOrderStatusSchema,
    orderFilterSchema,
    updateStoreSchema,
    idParamSchema
} from "../validations/manager.validation.js";

// Import manager controller functions
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

// Import live orders controller functions
import {
    getLiveOrders,
    getOrdersByStatus,
    getUrgentOrders,
    getOrderCounts
} from "../controllers/manager/liveOrders.controller.js";

const router = Router();

// Public manager routes (no authentication required)
router.post("/send-otp", managerSendOtp);
router.post("/verify-login", managerVerifyLogin);

// Protect all subsequent manager routes
router.use(verifyJWT, verifyRole("manager"));

// Manager Profile Management
router.get("/profile", getManagerProfile);
router.put("/profile", validateRequest(updateProfileSchema), updateManagerProfile);
router.put("/change-password", validateRequest(changePasswordSchema), changeManagerPassword);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Live Orders for TV Screen
router.get("/live-orders", getLiveOrders);
router.get("/live-orders/status/:status", getOrdersByStatus);
router.get("/live-orders/urgent", getUrgentOrders);
router.get("/live-orders/counts", getOrderCounts);

// Order Management
router.get("/orders", validateRequest(orderFilterSchema, 'query'), getOrders);
router.get("/orders/:id", validateRequest(idParamSchema, 'params'), getOrderById);
router.put("/orders/:id/status", 
    validateRequest(idParamSchema, 'params'),
    validateRequest(updateOrderStatusSchema), 
    updateOrderStatus
);

// Delivery Partner Management
router.get("/delivery-partners", getDeliveryPartners);
router.post("/delivery-partners", validateRequest(createDeliveryPartnerSchema), createDeliveryPartner);
router.put("/delivery-partners/:id", 
    validateRequest(idParamSchema, 'params'),
    validateRequest(updateDeliveryPartnerSchema), 
    updateDeliveryPartner
);
router.delete("/delivery-partners/:id", validateRequest(idParamSchema, 'params'), deleteDeliveryPartner);

// Store Management
router.get("/store", getStoreDetails);
router.put("/store", validateRequest(updateStoreSchema), updateStoreDetails);

export default router;