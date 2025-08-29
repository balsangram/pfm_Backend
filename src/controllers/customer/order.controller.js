// import { asyncHandler } from "../../utils/asyncHandler.js";
// import { ApiError } from "../../utils/ApiError.js";
// import { ApiResponse } from "../../utils/ApiResponse.js";
// import Customer from "../../models/customer/customer.model.js";
// import mongoose from "mongoose";
// import Store from "../../models/store/store.model.js";
// import Manager from "../../models/manager/manager.model.js";
// import Order from "../../models/catalog/order.model.js";
// import Coupons from "../../models/catalog/coupons.model.js";

// // Utility function to calculate distance between two lat/long points
// export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
//     const R = 6371; // Radius of the earth in km
//     const dLat = deg2rad(lat2 - lat1);
//     const dLon = deg2rad(lon2 - lon1);

//     const a =
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
//         Math.sin(dLon / 2) * Math.sin(dLon / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
// }

// function deg2rad(deg) {
//     return deg * (Math.PI / 180);
// }

// // Function to find nearest store with pincode priority
// export async function getNearestStore(stores, latitude, longitude, userPincode = null) {
//     console.log("🚀 ~ getNearestStore ~ stores, latitude, longitude, userPincode:", stores, latitude, longitude, userPincode);

//     let candidateStores = stores;
//     const PINCODE_RANGE = 5;

//     // If pincode is provided, filter stores within pincode range
//     if (userPincode) {
//         candidateStores = stores.filter(
//             (store) => store.pincode >= userPincode - PINCODE_RANGE && store.pincode <= userPincode + PINCODE_RANGE
//         );

//         // Sort by pincode proximity
//         candidateStores.sort((a, b) => Math.abs(a.pincode - userPincode) - Math.abs(b.pincode - userPincode));
//     }

//     // If no stores in pincode range, fall back to all stores
//     if (!candidateStores.length) {
//         candidateStores = stores;
//     }

//     // Find nearest store by lat/long
//     let nearestStore = null;
//     let minDistance = Infinity;

//     for (const store of candidateStores) {
//         if (!store.lat || !store.long) continue; // Skip stores without lat/long
//         const distance = getDistanceFromLatLonInKm(latitude, longitude, store.lat, store.long);

//         if (distance < minDistance) {
//             minDistance = distance;
//             nearestStore = store;
//         }
//     }

//     console.log("🚀 ~ getNearestStore ~ nearestStore:", nearestStore);
//     return nearestStore;
// }

// // Function to calculate total amount with wallet points or coupon
// async function calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId) {
//     let totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     if (walletPoint > 0) {
//         console.log("🚀 ~ calculateTotalAmount ~ customer.wallet:", customer.wallet);
//         console.log("🚀 ~ calculateTotalAmount ~ walletPoint:", walletPoint);
//         if (totalAmount >= 500) {
//             if (customer.wallet >= walletPoint) {
//                 console.log("🚀 ~ calculateTotalAmount ~ totalAmount (before):", totalAmount);

//                 // Deduct wallet points from totalAmount
//                 totalAmount -= walletPoint;

//                 console.log("🚀 ~ calculateTotalAmount ~ totalAmount (after):", totalAmount);

//                 // Deduct wallet points from customer wallet
//                 await Customer.findByIdAndUpdate(
//                     userId,
//                     { $inc: { wallet: -walletPoint } },
//                     { new: true }
//                 );
//             } else {
//                 throw new ApiError(400, "Insufficient wallet balance");
//             }
//         } else {
//             throw new ApiError(400, "Total amount must be at least 500 to use wallet points");
//         }
//     } else if (couponsId) {
//         const coupon = await Coupons.findById(couponsId);
//         if (coupon) {
//             console.log("🚀 ~ calculateTotalAmount ~ coupon.discount:", coupon.discount);

//             let discountPercent = coupon.discount;
//             let discountAmount = (totalAmount * discountPercent) / 100;

//             totalAmount -= discountAmount;

//             console.log("🚀 ~ calculateTotalAmount ~ totalAmount (after coupon):", totalAmount);
//         }
//     }

//     return totalAmount;
// }

// // Function to select store and prepare order items
// async function prepareOrderData(customer, latitude, longitude, pincode) {
//     let candidateStores = [];
//     const PINCODE_RANGE = 5;

//     // Fetch stores based on pincode or all active stores
//     if (pincode) {
//         const userPincode = Number(pincode);
//         if (isNaN(userPincode)) {
//             throw new ApiError(400, "Pincode must be a valid number");
//         }
//         candidateStores = await Store.find({
//             isActive: true,
//             pincode: { $gte: userPincode - PINCODE_RANGE, $lte: userPincode + PINCODE_RANGE }
//         }).populate("manager", "_id");
//     } else {
//         candidateStores = await Store.find({ isActive: true }).populate("manager", "_id");
//     }

//     // If no candidates, fallback to all active stores
//     if (!candidateStores.length) {
//         candidateStores = await Store.find({ isActive: true }).populate("manager", "_id");
//     }

//     // Find nearest store
//     const nearestStore = await getNearestStore(candidateStores, latitude, longitude, pincode ? Number(pincode) : null);
//     if (!nearestStore) throw new ApiError(404, "No nearby store found");

//     // Validate manager
//     if (!nearestStore.manager || !nearestStore.manager._id) {
//         throw new ApiError(404, "Nearest store has no assigned manager");
//     }
//     const manager = await Manager.findById(nearestStore.manager._id);
//     if (!manager) throw new ApiError(404, "Manager not found for nearest store");

//     // Prepare order items
//     const orderItems = customer.orders.map(item => ({
//         name: item.subCategory.name,
//         quantity: item.count,
//         price: item.subCategory.price,
//     }));

//     return { nearestStore, orderItems };
// }

// export const createOrder = asyncHandler(async (req, res) => {
//     const { userId } = req.params;
//     const { location, phone, latitude, longitude, notes, isUrgent, pincode, walletPoint, couponsId } = req.body;

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

//     // 4️⃣ Prepare order data (store and items)
//     const { nearestStore, orderItems } = await prepareOrderData(customer, latitude, longitude, pincode);

//     // 5️⃣ Calculate total amount with wallet points or coupon
//     const totalAmount = await calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId);

//     // 6️⃣ Create new order
//     const newOrder = await Order.create({
//         customer: customer._id,
//         clientName: customer.name || "Guest",
//         location,
//         pincode: pincode || nearestStore.pincode,
//         geoLocation: { type: "Point", coordinates: [longitude, latitude] },
//         orderDetails: orderItems,
//         phone: phone || customer.phone,
//         amount: totalAmount,
//         store: nearestStore._id,
//         manager: nearestStore.manager._id,
//         notes: notes || "",
//         isUrgent: !!isUrgent,
//         reason: "nearest place", // Set to match schema's enum
//     });

//     // 7️⃣ Move cart items to order history
//     if (!Array.isArray(customer.orderHistory)) customer.orderHistory = [];
//     customer.orders.forEach(item => {
//         customer.orderHistory.push({
//             order: newOrder._id,
//             orderedAt: item.orderedAt,
//         });
//     });

//     // 8️⃣ Clear customer's cart
//     customer.orders = [];
//     await customer.save();

//     return res
//         .status(201)
//         .json(new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully"));
// });

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Customer from "../../models/customer/customer.model.js";
import mongoose from "mongoose";
import Store from "../../models/store/store.model.js";
import Manager from "../../models/manager/manager.model.js";
import Order from "../../models/catalog/order.model.js";
import Coupons from "../../models/catalog/coupons.model.js";

// Utility function to calculate distance between two lat/long points
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Function to check if all order items are available in a store
function checkItemAvailability(store, orderItems) {
    return orderItems.every(item => {
        const subCategory = store.subCategories?.find(sc =>
            sc._id.toString() === item.subCategory._id.toString()
        );
        if (!subCategory) return false;

        const quantityEntry = subCategory.quantity?.find(q =>
            q.managerId.toString() === store.manager._id.toString()
        );
        return quantityEntry && quantityEntry.count >= item.count;
    });
}

// Function to find nearest store with pincode priority and item availability
export async function getNearestStore(stores, latitude, longitude, userPincode = null, orderItems) {
    console.log("🚀 ~ getNearestStore ~ stores, latitude, longitude, userPincode:", stores, latitude, longitude, userPincode);

    let candidateStores = stores;
    const PINCODE_RANGE = 5;

    // If pincode is provided, filter stores within pincode range
    if (userPincode) {
        candidateStores = stores.filter(
            (store) => store.pincode >= userPincode - PINCODE_RANGE &&
                store.pincode <= userPincode + PINCODE_RANGE
        );

        // Sort by pincode proximity
        candidateStores.sort((a, b) => Math.abs(a.pincode - userPincode) - Math.abs(b.pincode - userPincode));
    }

    // If no stores in pincode range, fall back to all stores
    if (!candidateStores.length) {
        candidateStores = stores;
    }

    // Find nearest store with available items
    let nearestStore = null;
    let minDistance = Infinity;

    for (const store of candidateStores) {
        if (!store.lat || !store.long) continue; // Skip stores without lat/long

        // Check if all items are available in this store
        if (!checkItemAvailability(store, orderItems)) continue;

        const distance = getDistanceFromLatLonInKm(latitude, longitude, store.lat, store.long);

        if (distance < minDistance) {
            minDistance = distance;
            nearestStore = store;
        }
    }

    console.log("🚀 ~ getNearestStore ~ nearestStore:", nearestStore);
    return nearestStore;
}

// Function to calculate total amount with wallet points or coupon
async function calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId) {
    let totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (walletPoint > 0) {
        console.log("🚀 ~ calculateTotalAmount ~ customer.wallet:", customer.wallet);
        console.log("🚀 ~ calculateTotalAmount ~ walletPoint:", walletPoint);
        if (totalAmount >= 500) {
            if (customer.wallet >= walletPoint) {
                console.log("🚀 ~ calculateTotalAmount ~ totalAmount (before):", totalAmount);

                // Deduct wallet points from totalAmount
                totalAmount -= walletPoint;

                console.log("🚀 ~ calculateTotalAmount ~ totalAmount (after):", totalAmount);

                // Deduct wallet points from customer wallet
                await Customer.findByIdAndUpdate(
                    userId,
                    { $inc: { wallet: -walletPoint } },
                    { new: true }
                );
            } else {
                throw new ApiError(400, "Insufficient wallet balance");
            }
        } else {
            throw new ApiError(400, "Total amount must be at least 500 to use wallet points");
        }
    } else if (couponsId) {
        const coupon = await Coupons.findById(couponsId);
        if (coupon) {
            console.log("🚀 ~ calculateTotalAmount ~ coupon.discount:", coupon.discount);

            let discountPercent = coupon.discount;
            let discountAmount = (totalAmount * discountPercent) / 100;

            totalAmount -= discountAmount;

            console.log("🚀 ~ calculateTotalAmount ~ totalAmount (after coupon):", totalAmount);
        }
    }

    return totalAmount;
}

// Function to select store and prepare order items
async function prepareOrderData(customer, latitude, longitude, pincode) {
    let candidateStores = [];
    const PINCODE_RANGE = 5;

    // Fetch stores based on pincode or all active stores
    if (pincode) {
        const userPincode = Number(pincode);
        if (isNaN(userPincode)) {
            throw new ApiError(400, "Pincode must be a valid number");
        }
        candidateStores = await Store.find({
            isActive: true,
            pincode: { $gte: userPincode - PINCODE_RANGE, $lte: userPincode + PINCODE_RANGE }
        })
            .populate("manager", "_id")
            .populate("subCategories"); // Populate subCategories to check availability
    } else {
        candidateStores = await Store.find({ isActive: true })
            .populate("manager", "_id")
            .populate("subCategories");
    }

    // If no candidates, fallback to all active stores
    if (!candidateStores.length) {
        candidateStores = await Store.find({ isActive: true })
            .populate("manager", "_id")
            .populate("subCategories");
    }

    // Prepare order items with subCategory reference
    const orderItems = customer.orders.map(item => ({
        name: item.subCategory.name,
        quantity: item.count,
        price: item.subCategory.price,
        subCategory: item.subCategory
    }));

    // Find nearest store with available items
    const nearestStore = await getNearestStore(
        candidateStores,
        latitude,
        longitude,
        pincode ? Number(pincode) : null,
        customer.orders
    );

    if (!nearestStore) throw new ApiError(404, "No nearby store with available items found");

    // Validate manager
    if (!nearestStore.manager || !nearestStore.manager._id) {
        throw new ApiError(404, "Nearest store has no assigned manager");
    }
    const manager = await Manager.findById(nearestStore.manager._id);
    if (!manager) throw new ApiError(404, "Manager not found for nearest store");

    return { nearestStore, orderItems };
}

export const createOrder = asyncHandler(async (req, res) => {
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

    // 4️⃣ Prepare order data (store and items)
    const { nearestStore, orderItems } = await prepareOrderData(customer, latitude, longitude, pincode);

    // 5️⃣ Calculate total amount with wallet points or coupon
    const totalAmount = await calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId);

    // 6️⃣ Create new order
    const newOrder = await Order.create({
        customer: customer._id,
        clientName: customer.name || "Guest",
        location,
        pincode: pincode || nearestStore.pincode,
        geoLocation: { type: "Point", coordinates: [longitude, latitude] },
        orderDetails: orderItems,
        phone: phone || customer.phone,
        amount: totalAmount,
        store: nearestStore._id,
        manager: nearestStore.manager._id,
        notes: notes || "",
        isUrgent: !!isUrgent,
        reason: "nearest place with available items", // Updated reason
    });

    // 7️⃣ Move cart items to order history
    if (!Array.isArray(customer.orderHistory)) customer.orderHistory = [];
    customer.orders.forEach(item => {
        customer.orderHistory.push({
            order: newOrder._id,
            orderedAt: item.orderedAt,
        });
    });

    // 8️⃣ Clear customer's cart
    customer.orders = [];
    await customer.save();

    // 9️⃣ Update store inventory
    for (const item of orderItems) {
        await Store.updateOne(
            {
                _id: nearestStore._id,
                "subCategories._id": item.subCategory._id
            },
            {
                $inc: {
                    "subCategories.$.quantity.$[elem].count": -item.quantity
                }
            },
            {
                arrayFilters: [{ "elem.managerId": nearestStore.manager._id }]
            }
        );
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully"));
});