import Order from "../../models/catalog/order.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Get all orders with full details
const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .populate({ path: "customer", select: "name" })
        .populate({ path: "deliveryPartner", select: "name" })
        .populate({ path: "pickedUpBy", select: "name" })
        .populate({ path: "store", select: "name" })
        .populate({ path: "manager", select: "name" })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, { orders }, "All orders retrieved successfully")
    );
});


export const AdminOrderController = {
    getAllOrders
};
