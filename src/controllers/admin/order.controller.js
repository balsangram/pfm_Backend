import Order from "../../models/catalog/order.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Get all orders with full details
const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .populate("customer")           // full customer details
        .populate("deliveryPartner")    // full delivery partner details
        .populate("pickedUpBy")         // full pickedUpBy details
        .populate("store")              // full store details
        .populate("manager")            // full manager details
        .sort({ createdAt: -1 });       // latest orders first

    return res.status(200).json(
        new ApiResponse(200, {
            orders
        }, "All orders retrieved successfully")
    );
});

export const AdminOrderController = {
    getAllOrders
};
