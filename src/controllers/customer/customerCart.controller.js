import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Customer from "../../models/customer/customer.model.js";
import SubCategory from "../../models/catalog/subCategorySchema.model.js";
import mongoose from "mongoose";
import Store from "../../models/store/store.model.js";
import Manager from "../../models/manager/manager.model.js"
import { getNearestStore } from "../../utils/geo.js";
import Order from "../../models/catalog/order.model.js";
import Coupons from "../../models/catalog/coupons.model.js";

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
            select: "name img price discount discountPrice description weight", // only required fields
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

// const editToCart = asyncHandler(async (req, res) => {
//     const { userId, itemId } = req.params;
//     let { count } = req.body; // expects { "count": 3 }

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
//         return res.status(400).json({ message: "Invalid ID format" });
//     }

//     // Ensure count is valid
//     count = Number(count);
//     console.log("🚀 ~ count:", count)
//     if (isNaN(count) || count <= 0) {
//         return res.status(400).json({ message: "Count must be a valid number greater than 0" });
//     }

//     // Find customer
//     const customer = await Customer.findById(userId);
//     console.log("🚀 ~ customer:", customer)
//     if (!customer) {
//         return res.status(404).json({ message: "Customer not found" });
//     }

//     // Find order index
//     const orderIndex = customer.orders.findIndex(
//         (order) => order._id.toString() === itemId
//     );

//     console.log("🚀 ~ orderIndex:", orderIndex)

//     if (orderIndex === -1) {
//         return res.status(404).json({ message: "Item not found in cart" });
//     }

//     // Update count only
//     customer.orders[orderIndex].count = count;

//     await customer.save();

//     res.status(200).json({
//         message: "Cart item count updated successfully",
//         updatedItem: customer.orders[orderIndex],
//         // cart: customer.orders
//     });
// });

// 🛒 Delete item from cart
// const editToCart = asyncHandler(async (req, res) => {
//     console.log("🚀 ~  req.body:", req.body)
//     const { userId, itemId } = req.params;
//     console.log("🚀 ~ req.params:", req.params)
//     let { count } = req.body; // expects { "count": 3 }
//     console.log("🚀 ~ count:", count)

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
//         return res.status(400).json({ message: "Invalid ID format" });
//     }

//     // Ensure count is valid
//     count = Number(count);
//     // console.log("🚀 ~ count:", count)
//     if (isNaN(count) || count <= 0) {
//         return res.status(400).json({ message: "Count must be a valid number greater than 0" });
//     }

//     // Find customer
//     const customer = await Customer.findById(userId);
//     // console.log("🚀 ~ customer:", customer)
//     if (!customer) {
//         return res.status(404).json({ message: "Customer not found" });
//     }

//     // Find the order in customer's cart
//     const order = customer.orders.find((order) => {
//         // Ensure both IDs are strings for accurate comparison
//         const orderId = order._id.toString();
//         const paramId = String(itemId).trim();

//         // console.log("🚀 ~ orderId:", orderId, "paramId:", paramId);
//         order === paramId
//         return order;
//     });

//     // console.log(order, "🚀 ~ !order:", !order)
//     if (!order) {
//         return res.status(404).json({ message: "Item not found in cart" });
//     }


//     // ✅ Update only the count
//     order.count = count;

//     await customer.save();
//     return res.status(200).json(
//         new ApiResponse(200, { updatedItem: order }, "Cart item count updated successfully", {
//             // totalItems,
//             // totalDiscountPrice,
//         })
//     );

// });

const editToCart = asyncHandler(async (req, res) => {
    const { userId, itemId } = req.params;
    let { count } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }

    // Ensure count is a valid number
    count = Number(count);
    if (isNaN(count) || count <= 0) {
        return res.status(400).json({ message: "Count must be a number greater than 0" });
    }

    // Find customer
    const customer = await Customer.findById(userId);
    if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
    }

    // Find the order in customer's cart by subCategory ID
    const order = customer.orders.find(
        (o) => o.subCategory.toString() === itemId
    );

    if (!order) {
        return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update the count
    order.count = count;

    await customer.save();

    return res.status(200).json(
        new ApiResponse(200, { updatedItem: order }, "Cart item count updated successfully")
    );
});

// const editToCart = asyncHandler(async (req, res) => {
//     const { userId, itemId } = req.params;
//     let { count } = req.body; // expects { "count": 3 }

//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
//         return res.status(400).json({ message: "Invalid ID format" });
//     }

//     count = Number(count);
//     if (isNaN(count) || count <= 0) {
//         return res.status(400).json({ message: "Count must be a valid number greater than 0" });
//     }

//     const customer = await Customer.findById(userId);
//     if (!customer) {
//         return res.status(404).json({ message: "Customer not found" });
//     }

//     // ✅ Corrected find
//     const order = customer.orders.find((order) => order._id.toString() === String(itemId).trim());

//     if (!order) {
//         return res.status(404).json({ message: "Item not found in cart" });
//     }

//     order.count = count;

//     await customer.save();

//     res.status(200).json({
//         message: "Cart item count updated successfully",
//         updatedItem: order,
//     });
// });


// const deleteToCart = asyncHandler(async (req, res) => {
//     const { userId, itemId } = req.params;
//     console.log("🚀 ~ req.params:", req.params)

//     // 🔑 Find the customer
//     const customer = await Customer.findById(userId);
//     console.log("🚀 ~ customer:", customer)
//     if (!customer) {
//         throw new ApiError(404, "Customer not found");
//     }

//     // 🔎 Find item index by order._id
//     const trimmedItemId = String(itemId).trim();
//     console.log("🚀 ~ trimmedItemId:", trimmedItemId)
//     const orderIndex = customer.SubCategory.findIndex(
//         (order) => {
//     console.log("🚀 ~ order:", order)
//     return order._id.toString() === trimmedItemId;
// }
//     );
//     console.log("🚀 ~ orderIndex:", orderIndex);

//     if (orderIndex === -1) {
//         throw new ApiError(404, "Item not found in cart");
//     }

//     // 🗑 Remove the item
//     customer.orders.splice(orderIndex, 1);
//     console.log("🚀 ~ customer:", customer)

//     await customer.save();

//     // Return updated cart and optionally count
//     return res.status(200).json(
//         new ApiResponse(
//             200,
//             // { orders: customer.orders, totalItems: customer.orders.length },
//             "Item deleted from cart successfully"
//         )
//     );
// });

const deleteToCart = asyncHandler(async (req, res) => {
    const { userId, itemId } = req.params; // itemId = subCategoryId
    console.log("🚀 ~ req.params:", req.params);

    // 🔑 Find the customer
    const customer = await Customer.findById(userId);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    // 🔎 Find item index by subCategory._id
    const trimmedItemId = String(itemId).trim();
    const orderIndex = customer.orders.findIndex(
        (order) => order.subCategory.toString() === trimmedItemId
    );
    console.log("🚀 ~ orderIndex:", orderIndex);

    if (orderIndex === -1) {
        throw new ApiError(404, "Item not found in cart");
    }

    // 🗑 Remove the item
    customer.orders.splice(orderIndex, 1);

    await customer.save();

    // 📊 Return updated cart
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders: customer.orders,
                totalItems: customer.orders.reduce((sum, o) => sum + o.count, 0),
            },
            "Item deleted from cart successfully"
        )
    );
});

// const deleteToCart = asyncHandler(async (req, res) => {
//     const { userId, itemId } = req.params; // itemId = subCategoryId
//     console.log("🚀 ~ req.params:", req.params);

//     // 🔑 Find the customer
//     const customer = await Customer.findById(userId).populate("orders.subCategory");
//     console.log("🚀 ~ customer:", customer)
//     if (!customer) {
//         throw new ApiError(404, "Customer not found");
//     }

//     // 🔎 Find item index by subCategory._id
//     const trimmedItemId = String(itemId).trim();
//     const orderIndex = customer.orders.findIndex(
//         (order) => order.subCategory.toString() === trimmedItemId
//     );

//     console.log("🚀 ~ orderIndex:", orderIndex);

//     if (orderIndex === -1) {
//         throw new ApiError(404, "Item not found in cart");
//     }

//     // 🗑 Remove the item from orders
//     customer.orders.splice(orderIndex, 1);
//     await customer.save();

//     // 📊 Recalculate cart summary
//     const totalItems = customer.orders.reduce((acc, item) => acc + item.count, 0);
//     const totalDiscountPrice = customer.orders.reduce(
//         (acc, item) => acc + item.count * (item.subCategory?.discountPrice || 0),
//         0
//     );

//     return res.status(200).json(
//         new ApiResponse(
//             200,
//             customer.orders,
//             "Item deleted from cart successfully",
//             { totalItems, totalDiscountPrice }
//         )
//     );
// });


// order

// 🟢 Get Order History
const orderHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid customer ID");
    }

    const orders = await Order.find({ customer: userId })
        .populate("store manager deliveryPartner", "name email phone") // optional: populate refs
        .sort({ createdAt: -1 }); // latest first

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Order history fetched successfully"));
});

// const createOrder = asyncHandler(async (req, res) => {
//     console.log("🚀 ~ req.params:", req.params);
//     console.log(req.body, "body");

//     const { userId } = req.params;
//     const { location, phone, latitude, longitude, pincode, notes, isUrgent } = req.body;

//     // 1️⃣ Validate userId
//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//         throw new ApiError(400, "Invalid customer ID");
//     }

//     // 2️⃣ Fetch customer
//     const customer = await Customer.findById(userId).populate("orders.subCategory");
//     // console.log("🚀 ~ customer:", customer)
//     if (!customer) throw new ApiError(404, "Customer not found");
//     if (!customer.orders?.length) throw new ApiError(400, "Cart is empty");

//     // 3️⃣ Validate lat/long
//     if (latitude == null || longitude == null) {
//         throw new ApiError(400, "Latitude and Longitude are required");
//     }

//     // 4️⃣ First match stores by pincode
//     // let candidateStores = await Store.find({ isActive: true, pincode });
//     // console.log("🚀 ~ candidateStores:", candidateStores)
//     // if (!candidateStores.length) {
//     //     // fallback → get all active stores
//     //     candidateStores = await Store.find({ isActive: true });
//     // }

//     const userPincode = Number(req.body.pincode);
//     // console.log("🚀 ~ userPincode:", userPincode)
//     const range = 5; // allowable difference

//     // Find all active stores within ±range
//     let candidateStores = await Store.find({
//         isActive: true,
//         pincode: { $gte: userPincode - range, $lte: userPincode + range }
//     }).populate("manager", "_id"); // populate only _id

//     // Extract only manager IDs
//     const managerIds = candidateStores
//         .filter(store => store?.manager?._id) // only valid ones
//         .map(store => store.manager._id.toString());

//     console.log("🚀 ~ Manager IDs:", managerIds);

//     // If no nearby stores, fallback to all active stores
//     if (!candidateStores.length) {
//         candidateStores = await Store.find({ isActive: true });
//     }

//     // Sort by nearest pincode
//     candidateStores.sort((a, b) => Math.abs(a.pincode - userPincode) - Math.abs(b.pincode - userPincode));



//     // 5️⃣ Find nearest store among candidates
//     const nearestStore = getNearestStore(candidateStores, latitude, longitude);
//     console.log("🚀 ~ nearestStore:", nearestStore);
//     if (!nearestStore) throw new ApiError(404, "No nearby store found");
//     console.log(nearestStore, "nearestStore.manager");

//     // 6️⃣ Validate store manager
//     const manager = await Manager.findById(nearestStore);
//     if (!manager) throw new ApiError(404, "No manager found for nearest store");

//     // 7️⃣ Prepare order items
//     const orderItems = customer.orders.map(item => ({
//         name: item.subCategory.name,
//         quantity: item.count,
//         price: item.subCategory.price,
//     }));
//     const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     // 8️⃣ Create new order
//     const newOrder = await Order.create({
//         customer: customer._id,
//         clientName: customer.name || "Guest",
//         location,
//         pincode, // ✅ include pincode
//         geoLocation: { type: "Point", coordinates: [longitude, latitude] },
//         orderDetails: orderItems,
//         phone: phone || customer.phone,
//         amount: totalAmount,
//         store: nearestStore._id,
//         manager: manager._id,
//         notes: notes || "",
//         isUrgent: !!isUrgent,
//     });

//     // 9️⃣ Move cart items to order history
//     if (!Array.isArray(customer.orderHistory)) customer.orderHistory = [];
//     customer.orders.forEach(item => {
//         customer.orderHistory.push({
//             order: newOrder._id,
//             orderedAt: item.orderedAt,
//         });
//     });

//     // 🔟 Clear customer's cart
//     customer.orders = [];
//     await customer.save();

//     return res
//         .status(201)
//         .json(new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully"));
// });

// controller

// const createOrder = asyncHandler(async (req, res) => {
//     console.log("🚀 ~ req.params:", req.params);
//     console.log(req.body, "body");

//     const { userId } = req.params;
//     const { location, phone, latitude, longitude, notes, isUrgent } = req.body;

//     // 1️⃣ Validate userId
//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//         throw new ApiError(400, "Invalid customer ID");
//     }

//     // 2️⃣ Fetch customer
//     const customer = await Customer.findById(userId).populate("orders.subCategory");
//     if (!customer) throw new ApiError(404, "Customer not found");
//     if (!customer.orders?.length) throw new ApiError(400, "Cart is empty");

//     // 3️⃣ Validate lat/long
//     if (latitude == null || longitude == null) {
//         throw new ApiError(400, "Latitude and Longitude are required");
//     }

//     // 4️⃣ Validate and normalize pincode
//     const userPincode = Number(req.body.pincode);
//     if (!userPincode || isNaN(userPincode)) {
//         throw new ApiError(400, "Pincode is required and must be a number");
//     }

//     const range = 5; // allowable difference

//     // 5️⃣ Find all active stores within ±range
//     let candidateStores = await Store.find({
//         isActive: true,
//         pincode: { $gte: userPincode - range, $lte: userPincode + range }
//     }).populate("manager", "_id"); // populate only _id

//     // Extract only manager IDs
//     const managerIds = candidateStores
//         .filter(store => store?.manager?._id) // only valid ones
//         .map(store => store.manager._id.toString());

//     console.log("🚀 ~ Manager IDs:", managerIds);

//     // 6️⃣ If no nearby stores, fallback to all active stores
//     if (!candidateStores.length) {
//         candidateStores = await Store.find({ isActive: true }).populate("manager", "_id");
//     }

//     // 7️⃣ Sort by nearest pincode
//     candidateStores.sort((a, b) => Math.abs(a.pincode - userPincode) - Math.abs(b.pincode - userPincode));

//     // 8️⃣ Find nearest store among candidates
//     const nearestStore = getNearestStore(candidateStores, latitude, longitude);
//     console.log("🚀 ~ nearestStore:", nearestStore);
//     if (!nearestStore) throw new ApiError(404, "No nearby store found");

//     // 9️⃣ Validate store manager
//     if (!nearestStore.manager || !nearestStore.manager._id) {
//         throw new ApiError(404, "Nearest store has no assigned manager");
//     }

//     console.log(nearestStore.manager._id, "managerIds");

//     const manager = await Manager.findById(nearestStore.manager._id);
//     console.log("🚀 ~ manager:", manager);
//     if (!manager) throw new ApiError(404, "Manager not found for nearest store");

//     // 🔟 Prepare order items
//     const orderItems = customer.orders.map(item => ({
//         name: item.subCategory.name,
//         quantity: item.count,
//         price: item.subCategory.price,
//     }));
//     const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     // 11️⃣ Create new order
//     const newOrder = await Order.create({
//         customer: customer._id,
//         clientName: customer.name || "Guest",
//         location,
//         pincode: userPincode, // ✅ always numeric
//         geoLocation: { type: "Point", coordinates: [longitude, latitude] },
//         orderDetails: orderItems,
//         phone: phone || customer.phone,
//         amount: totalAmount,
//         store: nearestStore._id,
//         manager: nearestStore.manager._id,
//         notes: notes || "",
//         isUrgent: !!isUrgent,
//     });

//     // 12️⃣ Move cart items to order history
//     if (!Array.isArray(customer.orderHistory)) customer.orderHistory = [];
//     customer.orders.forEach(item => {
//         customer.orderHistory.push({
//             order: newOrder._id,
//             orderedAt: item.orderedAt,
//         });
//     });

//     // 13️⃣ Clear customer's cart
//     customer.orders = [];
//     await customer.save();

//     return res
//         .status(201)
//         .json(new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully"));
// });

const createOrder = asyncHandler(async (req, res) => {
    console.log("🚀 ~ req.params:", req.params);
    console.log(req.body, "body");

    const { userId } = req.params;
    const { location, phone, latitude, longitude, notes, isUrgent, pincode, walletPoint, couponsId } = req.body;

    // 1️⃣ Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid customer ID");
    }

    // 2️⃣ Fetch customer
    const customer = await Customer.findById(userId).populate("orders.subCategory");
    if (!customer) throw new ApiError(404, "Customer not found");
    if (!customer.orders?.length) throw new ApiError(400, "Cart is empty");

    // 3️⃣ Validate lat/long
    if (latitude == null || longitude == null) {
        throw new ApiError(400, "Latitude and Longitude are required");
    }

    let candidateStores = [];
    let userPincode = null;

    // 4️⃣ If pincode is provided → search by pincode range
    if (pincode) {
        userPincode = Number(pincode);
        if (!userPincode || isNaN(userPincode)) {
            throw new ApiError(400, "Pincode must be a valid number");
        }

        const range = 5;
        candidateStores = await Store.find({
            isActive: true,
            pincode: { $gte: userPincode - range, $lte: userPincode + range }
        }).populate("manager", "_id");
    } else {
        // 5️⃣ If no pincode → search purely by geoLocation (nearest lat/long)
        candidateStores = await Store.find({ isActive: true }).populate("manager", "_id");
    }

    // 6️⃣ If no candidates, fallback to all active stores
    if (!candidateStores.length) {
        candidateStores = await Store.find({ isActive: true }).populate("manager", "_id");
    }

    // 7️⃣ If pincode was provided → sort by nearest pincode
    if (userPincode) {
        candidateStores.sort((a, b) => Math.abs(a.pincode - userPincode) - Math.abs(b.pincode - userPincode));
    }

    // 8️⃣ Find nearest store (based on lat/long in both cases)
    const nearestStore = getNearestStore(candidateStores, latitude, longitude);
    if (!nearestStore) throw new ApiError(404, "No nearby store found");

    // 9️⃣ Validate manager
    if (!nearestStore.manager || !nearestStore.manager._id) {
        throw new ApiError(404, "Nearest store has no assigned manager");
    }

    const manager = await Manager.findById(nearestStore.manager._id);
    if (!manager) throw new ApiError(404, "Manager not found for nearest store");

    // 🔟 Prepare order items
    const orderItems = customer.orders.map(item => ({
        name: item.subCategory.name,
        quantity: item.count,
        price: item.subCategory.price,
    }));
    let totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    console.log("🚀 ~ totalAmount:", totalAmount)

    console.log(couponsId, "couponsId");

    if (walletPoint > 0) {
        totalAmount -= walletPoint;
    } else if (couponsId) {
        const coupon = await Coupons.findById(couponsId);
        console.log("🚀 ~ coupon:", coupon.discount)
        let discountPercent = coupon.discount;
        let discountAmount = (totalAmount * discountPercent) / 100;
        if (coupon) {
            totalAmount -= discountAmount; // example
        }
    }

    console.log("🚀 ~ totalAmount:", totalAmount)



    // 11️⃣ Create new order
    const newOrder = await Order.create({
        customer: customer._id,
        clientName: customer.name || "Guest",
        location,
        pincode: userPincode || nearestStore.pincode, // ✅ fallback to store pincode if not provided
        geoLocation: { type: "Point", coordinates: [longitude, latitude] },
        orderDetails: orderItems,
        phone: phone || customer.phone,
        amount: totalAmount,
        store: nearestStore._id,
        manager: nearestStore.manager._id,
        notes: notes || "",
        isUrgent: !!isUrgent,
    });

    // 12️⃣ Move cart items to order history
    if (!Array.isArray(customer.orderHistory)) customer.orderHistory = [];
    customer.orders.forEach(item => {
        customer.orderHistory.push({
            order: newOrder._id,
            orderedAt: item.orderedAt,
        });
    });

    // 13️⃣ Clear customer's cart
    customer.orders = [];
    await customer.save();

    return res
        .status(201)
        .json(new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully"));
});

// const cancelOrder = asyncHandler(async (req, res) => {
//     const { userId, orderId } = req.params;
//     const { notes } = req.body;
//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({ message: "Invalid userId or orderId" });
//     }

//     // Find the order for the user (customer field, not userId)
//     const order = await Order.findOne({ _id: orderId, customer: userId });
//     if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//     }

//     // Check if already cancelled or delivered
//     if (order.status === "cancelled") {
//         return res.status(400).json({ message: "Order already cancelled" });
//     }
//     if (order.status === "delivered") {
//         return res.status(400).json({ message: "Delivered order cannot be cancelled" });
//     }

//     // Update status
//     order.status = "cancelled";
//     await order.save();

//     res.status(200).json({
//         message: "Order cancelled successfully",
//         order
//     });
// });

const cancelOrder = asyncHandler(async (req, res) => {
    const { userId, orderId } = req.params;
    const { notes } = req.body;

    // ✅ Check if notes are provided
    if (!notes || notes.trim() === "") {
        return res.status(400).json({ message: "Cancellation note is required" });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid userId or orderId" });
    }

    // Find the order for the user
    const order = await Order.findOne({ _id: orderId, customer: userId });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    // Check status
    if (order.status === "cancelled") {
        return res.status(400).json({ message: "Order already cancelled" });
    }
    if (order.status === "delivered") {
        return res.status(400).json({ message: "Delivered order cannot be cancelled" });
    }

    // Update status and add cancellation note
    order.status = "cancelled";
    order.notes = notes; // ✅ always required now
    console.log("🚀 ~ notes:", notes)
    await order.save();
    console.log("🚀 ~ order:", order)

    res.status(200).json({
        message: "Order cancelled successfully",
        order
    });
});


const totalProductAmount = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "UserId is required"));
    }

    // Fetch customer and populate subCategory to get discountPrice
    const customer = await Customer.findById(userId).populate("orders.subCategory", "discountPrice");

    if (!customer) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, "Customer not found"));
    }

    let totalCount = 0;
    let totalAmount = 0;

    customer.orders.forEach((item) => {
        const quantity = item.count || 1;
        const price = item.subCategory?.discountPrice || 0;
        totalCount += quantity;
        totalAmount += price * quantity;
    });

    return res.status(200).json(
        new ApiResponse(200,
            {
                totalCount,
                totalAmount
            },
            "Order history fetched successfully"
        )
    );
});

export const customerCartController = {
    displayCartDetails,
    addToCart,
    editToCart,
    deleteToCart,

    orderHistory,
    createOrder,
    cancelOrder,

    totalProductAmount
}