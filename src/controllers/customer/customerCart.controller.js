import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Customer from "../../models/customer/customer.model.js";
import SubCategory from "../../models/catalog/subCategorySchema.model.js";
import mongoose from "mongoose";
import Store from "../../models/store/store.model.js";
import Manager from "../../models/manager/manager.model.js"
import { getNearestStore } from "../../utils/geo.js";
import Order from "../../models/catalog/order.model.js"

// ✅ Display Cart Details
const displayCartDetails = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // 🔹 Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // 🔹 Find customer & populate subCategory details
    const customer = await Customer.findById(userId)
        .populate({
            path: "orders.subCategory",
            select: "name img price", // only required fields
        })
        .select("name phone wallet orders");

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    // 🔹 Return cart details
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                customer.orders,
                "Cart details fetched successfully"
            )
        );
});

const addToCart = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { subCategoryId, count } = req.body;

    if (!subCategoryId) {
        throw new ApiError(400, "SubCategoryId is required");
    }

    // validate subCategory exists
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
        throw new ApiError(404, "SubCategory not found");
    }

    // find customer
    const customer = await Customer.findById(userId);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    // check if subCategory already in cart
    const existingOrder = customer.orders.find(
        (order) => order.subCategory.toString() === subCategoryId
    );

    if (existingOrder) {
        // 🚫 if already in cart, throw error
        throw new ApiError(400, "Item already exists in cart");
    }

    // ✅ add new item (only if count > 0)
    if ((count || 1) > 0) {
        customer.orders.push({
            subCategory: subCategoryId,
            count: count || 1,
        });
    } else {
        throw new ApiError(400, "Invalid count value");
    }

    await customer.save();

    return res
        .status(201)
        .json(new ApiResponse(201, customer.orders, "Item added to cart"));
});

const editToCart = asyncHandler(async (req, res) => {
    const { userId, itemId } = req.params;
    let { count } = req.body; // expects { "count": 3 }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }

    // Ensure count is valid
    count = Number(count);
    console.log("🚀 ~ count:", count)
    if (isNaN(count) || count <= 0) {
        return res.status(400).json({ message: "Count must be a valid number greater than 0" });
    }

    // Find customer
    const customer = await Customer.findById(userId);
    console.log("🚀 ~ customer:", customer)
    if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
    }

    // Find order index
    const orderIndex = customer.orders.findIndex(
        (order) => order._id.toString() === itemId
    );

    console.log("🚀 ~ orderIndex:", orderIndex)

    if (orderIndex === -1) {
        return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update count only
    customer.orders[orderIndex].count = count;

    await customer.save();

    res.status(200).json({
        message: "Cart item count updated successfully",
        updatedItem: customer.orders[orderIndex],
        // cart: customer.orders
    });
});

// 🛒 Delete item from cart
const deleteToCart = asyncHandler(async (req, res) => {
    const { userId, itemId } = req.params;

    // 🔑 Find the customer
    const customer = await Customer.findById(userId);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    // 🔎 Find item index by order._id
    const orderIndex = customer.orders.findIndex(
        (order) => order._id.toString() === itemId
    );
    console.log("🚀 ~ orderIndex:", orderIndex)

    if (orderIndex === -1) {
        throw new ApiError(404, "Item not found in cart");
    }

    // 🗑 Remove the item
    customer.orders.splice(orderIndex, 1);

    await customer.save();

    return res
        .status(200)
        .json(new ApiResponse(200, customer.orders, "Item deleted from cart successfully"));
});

// order

const orderHistory = asyncHandler(async (req, res) => {

})

const createOrder = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { location, phone, notes, isUrgent, latitude, longitude } = req.body;

    // Validate userId and coordinates
    if (!userId || !mongoose.Types.ObjectId.isValid(userId))
        throw new ApiError(400, "Invalid user ID");
    if (latitude == null || longitude == null)
        throw new ApiError(400, "Latitude and Longitude are required");

    // Fetch customer and populate cart
    const customer = await Customer.findById(userId).populate("orders.subCategory");
    if (!customer) throw new ApiError(404, "Customer not found");
    if (!customer.orders?.length) throw new ApiError(400, "Cart is empty");

    // Fetch all active stores and find nearest
    const stores = await Store.find({ isActive: true });
    const nearestStore = getNearestStore(stores, latitude, longitude);
    if (!nearestStore) throw new ApiError(404, "No nearby store found");

    // Find store manager
    const manager = await Manager.findById(nearestStore.manager);
    if (!manager) throw new ApiError(404, "No manager found for nearest store");

    // Prepare order items
    const orderItems = customer.orders.map(item => ({
        name: item.subCategory.name,
        quantity: item.count,
        price: item.subCategory.price
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create new order
    const newOrder = await Order.create({
        customer: customer._id,
        clientName: customer.name || "Guest",
        location,
        geoLocation: { type: "Point", coordinates: [longitude, latitude] },
        orderDetails: orderItems,
        phone: phone || customer.phone,
        amount: totalAmount,
        store: nearestStore._id,
        manager: manager._id,
        notes: notes || "",
        isUrgent: !!isUrgent
    });

    // Move cart items to order history
    if (!Array.isArray(customer.orderHistory)) customer.orderHistory = [];
    customer.orders.forEach(item => {
        customer.orderHistory.push({
            order: newOrder._id,
            orderedAt: item.orderedAt
        });
    });

    // Clear customer's cart
    customer.orders = [];
    await customer.save();

    return res.status(201).json(
        new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully")
    );
});


const cancelOrder = asyncHandler(async (req, res) => {

})

export const customerCartController = {
    displayCartDetails,
    addToCart,
    editToCart,
    deleteToCart,

    orderHistory,
    createOrder,
    cancelOrder,
}