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

// Function to find nearest store with pincode priority
export async function getNearestStore(stores, latitude, longitude, userPincode = null) {
    console.log("🚀 ~ getNearestStore ~ stores, latitude, longitude, userPincode:", stores, latitude, longitude, userPincode);

    let candidateStores = stores;
    const PINCODE_RANGE = 5;

    // If pincode is provided, filter stores within pincode range
    if (userPincode) {
        candidateStores = stores.filter(
            (store) => store.pincode >= userPincode - PINCODE_RANGE && store.pincode <= userPincode + PINCODE_RANGE
        );

        // Sort by pincode proximity
        candidateStores.sort((a, b) => Math.abs(a.pincode - userPincode) - Math.abs(b.pincode - userPincode));
    }

    // If no stores in pincode range, fall back to all stores
    if (!candidateStores.length) {
        candidateStores = stores;
    }

    // Find nearest store by lat/long
    let nearestStore = null;
    let minDistance = Infinity;

    for (const store of candidateStores) {
        if (!store.lat || !store.long) continue; // Skip stores without lat/long
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
        }).populate("manager", "_id");
    } else {
        candidateStores = await Store.find({ isActive: true }).populate("manager", "_id");
    }

    // If no candidates, fallback to all active stores
    if (!candidateStores.length) {
        candidateStores = await Store.find({ isActive: true }).populate("manager", "_id");
    }

    // Find nearest store
    const nearestStore = await getNearestStore(candidateStores, latitude, longitude, pincode ? Number(pincode) : null);
    if (!nearestStore) throw new ApiError(404, "No nearby store found");

    // Validate manager
    if (!nearestStore.manager || !nearestStore.manager._id) {
        throw new ApiError(404, "Nearest store has no assigned manager");
    }
    const manager = await Manager.findById(nearestStore.manager._id);
    if (!manager) throw new ApiError(404, "Manager not found for nearest store");

    // Prepare order items
    const orderItems = customer.orders.map(item => ({
        name: item.subCategory.name,
        quantity: item.count,
        price: item.subCategory.price,
    }));

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
        reason: "nearest place", // Set to match schema's enum
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

    return res
        .status(201)
        .json(new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully"));
});
// src / controllers / customer / order.controller.js




// import { asyncHandler } from "../../utils/asyncHandler.js";
// import { ApiError } from "../../utils/ApiError.js";
// import { ApiResponse } from "../../utils/ApiResponse.js";
// import Customer from "../../models/customer/customer.model.js";
// import mongoose from "mongoose";
// import Store from "../../models/store/store.model.js";
// import Manager from "../../models/manager/manager.model.js";
// import Order from "../../models/catalog/order.model.js";
// import Coupons from "../../models/catalog/coupons.model.js";
// import SubCategory from "../../models/catalog/subCategorySchema.model.js";

// // Utility function to calculate distance
// export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
//     const R = 6371;
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

// function checkItemAvailability(store, orderItems, subCategories) {
//     return orderItems.every(item => {
//         const subCategory = subCategories.find(sc =>
//             sc._id.toString() === item.subCategory._id.toString()
//         );
//         if (!subCategory) return false;
//         const quantityEntry = subCategory.quantity?.find(q =>
//             q.managerId.toString() === store.manager._id.toString()
//         );
//         return quantityEntry && quantityEntry.count >= item.count;
//     });
// }

// export async function getNearestStore(stores, latitude, longitude, userPincode = null, orderItems, subCategories) {
//     console.log("🚀 ~ getNearestStore ~ stores, latitude, longitude, userPincode:", stores, latitude, longitude, userPincode);

//     let candidateStores = stores;
//     const PINCODE_RANGE = 5;

//     if (userPincode) {
//         candidateStores = stores.filter(
//             store => Number(store.pincode) >= userPincode - PINCODE_RANGE &&
//                 Number(store.pincode) <= userPincode + PINCODE_RANGE
//         );
//         candidateStores.sort((a, b) => Math.abs(Number(a.pincode) - userPincode) - Math.abs(Number(b.pincode) - userPincode));
//     }

//     if (!candidateStores.length) {
//         candidateStores = stores;
//     }

//     let nearestStore = null;
//     let minDistance = Infinity;

//     for (const store of candidateStores) {
//         if (!store.lat || !store.long) continue;
//         if (!checkItemAvailability(store, orderItems, subCategories)) continue;
//         const distance = getDistanceFromLatLonInKm(latitude, longitude, store.lat, store.long);
//         if (distance < minDistance) {
//             minDistance = distance;
//             nearestStore = store;
//         }
//     }

//     console.log("🚀 ~ getNearestStore ~ nearestStore:", nearestStore);
//     return nearestStore;
// }

// async function calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId) {
//     let totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     if (walletPoint > 0) {
//         if (totalAmount >= 500) {
//             if (customer.wallet >= walletPoint) {
//                 totalAmount -= walletPoint;
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
//             const discountAmount = (totalAmount * coupon.discount) / 100;
//             totalAmount -= discountAmount;
//         }
//     }

//     return totalAmount;
// }

// async function prepareOrderData(customer, latitude, longitude, pincode) {
//     let candidateStores = [];
//     const PINCODE_RANGE = 5000000000;

//     if (pincode) {
//         const userPincode = Number(pincode);
//         if (isNaN(userPincode)) {
//             throw new ApiError(400, "Pincode must be a valid number");
//         }
//         candidateStores = await Store.find({
//             isActive: true,
//             pincode: { $gte: String(userPincode - PINCODE_RANGE), $lte: String(userPincode + PINCODE_RANGE) }
//         })
//             .populate("manager", "_id");
//     } else {
//         candidateStores = await Store.find({ isActive: true })
//             .populate("manager", "_id");
//     }

//     if (!candidateStores.length) {
//         candidateStores = await Store.find({ isActive: true })
//             .populate("manager", "_id");
//     }

//     const subCategories = await SubCategory.find({
//         _id: { $in: customer.orders.map(item => item.subCategory) }
//     });

//     const orderItems = customer.orders.map(item => ({
//         name: item.subCategory.name,
//         quantity: item.count,
//         price: item.subCategory.price,
//         subCategory: item.subCategory
//     }));

//     const nearestStore = await getNearestStore(
//         candidateStores,
//         latitude,
//         longitude,
//         pincode ? Number(pincode) : null,
//         customer.orders,
//         subCategories
//     );

//     if (!nearestStore) throw new ApiError(404, "No nearby store with available items found");

//     if (!nearestStore.manager || !nearestStore.manager._id) {
//         throw new ApiError(404, "Nearest store has no assigned manager");
//     }
//     const manager = await Manager.findById(nearestStore.manager._id);
//     if (!manager) throw new ApiError(404, "Manager not found for nearest store");

//     return { nearestStore, orderItems };
// }

// export const createOrder = asyncHandler(async (req, res) => {
//     const { userId } = req.params;
//     const { location, phone, latitude, longitude, notes, isUrgent, pincode, walletPoint, couponsId } = req.body;

//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//         throw new ApiError(400, "Invalid customer ID");
//     }

//     const customer = await Customer.findById(userId).populate("orders.subCategory");
//     if (!customer) throw new ApiError(404, "Customer not found");
//     if (!customer.orders?.length) throw new ApiError(400, "Cart is empty");

//     if (latitude == null || longitude == null) {
//         throw new ApiError(400, "Latitude and Longitude are required");
//     }

//     const { nearestStore, orderItems } = await prepareOrderData(customer, latitude, longitude, pincode);

//     const totalAmount = await calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId);

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
//         reason: "nearest place"
//     });

//     if (!Array.isArray(customer.orderHistory)) customer.orderHistory = [];
//     customer.orders.forEach(item => {
//         customer.orderHistory.push({
//             order: newOrder._id,
//             orderedAt: item.orderedAt
//         });
//     });

//     customer.orders = [];
//     await customer.save();

//     for (const item of orderItems) {
//         const updateResult = await SubCategory.updateOne(
//             {
//                 _id: item.subCategory._id,
//                 "quantity.managerId": nearestStore.manager._id
//             },
//             {
//                 $inc: {
//                     "quantity.$.count": -item.quantity
//                 }
//             }
//         );
//         if (updateResult.matchedCount === 0) {
//             throw new ApiError(400, `SubCategory ${item.subCategory._id} inventory not found for manager ${nearestStore.manager._id}`);
//         }
//     }

//     return res
//         .status(201)
//         .json(new ApiResponse(201, { order: newOrder, nearestStore }, "Order created successfully"));
// });

// import { asyncHandler } from "../../utils/asyncHandler.js";
// import { ApiError } from "../../utils/ApiError.js";
// import { ApiResponse } from "../../utils/ApiResponse.js";
// import Customer from "../../models/customer/customer.model.js";
// import mongoose from "mongoose";
// import Store from "../../models/store/store.model.js";
// import Manager from "../../models/manager/manager.model.js";
// import Order from "../../models/catalog/order.model.js";
// import Coupons from "../../models/catalog/coupons.model.js";
// import SubCategory from "../../models/catalog/subCategorySchema.model.js";

// // Utility function to calculate distance
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

// // Check if all order items are available in a store
// function checkItemAvailability(store, orderItems, subCategories) {
//     console.log("🚀 ~ checkItemAvailability ~ store._id:", store._id);
//     console.log("🚀 ~ checkItemAvailability ~ orderItems:", JSON.stringify(orderItems, null, 2));
//     console.log("🚀 ~ checkItemAvailability ~ subCategories:", JSON.stringify(subCategories, null, 2));

//     return orderItems.every((item, index) => {
//         console.log(`🚀 ~ checkItemAvailability ~ checking item ${index + 1}:`, JSON.stringify(item, null, 2));
//         const subCategory = subCategories.find(sc =>
//             sc._id.toString() === item.subCategory._id.toString()
//         );
//         console.log("🚀 ~ checkItemAvailability ~ subCategory:", JSON.stringify(subCategory, null, 2));

//         if (!subCategory) {
//             console.log(`❌ Item ${item.subCategory._id} - SubCategory not found`);
//             return false;
//         }

//         const quantityEntry = subCategory.quantity?.find(q =>
//             q.managerId.toString() === store.manager._id.toString()
//         );
//         console.log("🚀 ~ checkItemAvailability ~ quantityEntry:", JSON.stringify(quantityEntry, null, 2));

//         if (!quantityEntry) {
//             console.log(`❌ Item ${item.subCategory._id} - No inventory for manager ${store.manager._id}`);
//             return false;
//         }

//         const isAvailable = quantityEntry.count >= item.count;
//         console.log(
//             `🚀 ~ checkItemAvailability ~ item ${item.subCategory._id}: count=${quantityEntry.count}, required=${item.count}, available=${isAvailable}`
//         );

//         return isAvailable;
//     });
// }

// // Find the nearest store with all requested items, prioritizing pincode
// export async function getNearestStore(stores, latitude, longitude, pincode, orderItems, subCategories) {
//     if (!stores || !stores.length) {
//         console.log("⚠️ No stores provided");
//         return null;
//     }
//     if (latitude == null || longitude == null) {
//         console.log("⚠️ Latitude and Longitude are required");
//         return null;
//     }

//     console.log("🚀 ~ getNearestStore ~ stores:", stores.length);
//     console.log("🚀 ~ getNearestStore ~ latitude, longitude, pincode:", latitude, longitude, pincode);

//     // Step 1: Filter stores by pincode (if provided)
//     let candidateStores = stores;
//     if (pincode) {
//         candidateStores = stores.filter(store => store.pincode === pincode);
//         console.log("🚀 ~ getNearestStore ~ candidateStores (pincode match):", candidateStores.length);
//     }

//     // Step 2: Sort stores by distance
//     const sortedStores = candidateStores
//         .map(store => ({
//             store,
//             distance: store.lat && store.long
//                 ? getDistanceFromLatLonInKm(latitude, longitude, store.lat, store.long)
//                 : Infinity
//         }))
//         .sort((a, b) => a.distance - b.distance);

//     // Step 3: Check stores in order of proximity
//     let nearestStore = null;
//     let inventoryWarnings = [];

//     for (const { store, distance } of sortedStores) {
//         if (distance === Infinity || !store.lat || !store.long) {
//             console.log(`⏭️ Skipping store ${store._id} - missing coordinates`);
//             continue;
//         }

//         const available = checkItemAvailability(store, orderItems, subCategories);
//         console.log("🚀 ~ getNearestStore ~ store:", store._id, "available:", available);

//         if (!available) {
//             console.log(`❌ Store ${store._id} skipped - not all items available`);
//             inventoryWarnings.push(`Store ${store._id} lacks sufficient inventory`);
//             continue;
//         }

//         console.log(`📍 Store ${store._id} distance = ${distance.toFixed(2)} km`);
//         nearestStore = store;
//         break; // Return the first store with all items available
//     }

//     // Step 4: Fallback to all stores if no pincode-matched store is found
//     if (!nearestStore && pincode && candidateStores.length < stores.length) {
//         console.log("🚀 ~ getNearestStore ~ No pincode-matched store found, checking all stores");
//         const otherStores = stores.filter(store => store.pincode !== pincode);
//         const sortedOtherStores = otherStores
//             .map(store => ({
//                 store,
//                 distance: store.lat && store.long
//                     ? getDistanceFromLatLonInKm(latitude, longitude, store.lat, store.long)
//                     : Infinity
//             }))
//             .sort((a, b) => a.distance - b.distance);

//         for (const { store, distance } of sortedOtherStores) {
//             if (distance === Infinity || !store.lat || !store.long) {
//                 console.log(`⏭️ Skipping store ${store._id} - missing coordinates`);
//                 continue;
//             }

//             const available = checkItemAvailability(store, orderItems, subCategories);
//             console.log("🚀 ~ getNearestStore ~ store:", store._id, "available:", available);

//             if (!available) {
//                 console.log(`❌ Store ${store._id} skipped - not all items available`);
//                 inventoryWarnings.push(`Store ${store._id} lacks sufficient inventory`);
//                 continue;
//             }

//             console.log(`📍 Store ${store._id} distance = ${distance.toFixed(2)} km`);
//             nearestStore = store;
//             break; // Return the first store with all items available
//         }
//     }

//     // Step 5: Fallback to closest store with warning if no store has all items
//     if (!nearestStore) {
//         console.log("⚠️ No store found with all required items, returning closest store as fallback");
//         const closestStore = sortedStores.find(({ store, distance }) => distance !== Infinity);
//         if (closestStore) {
//             console.log(`📍 Fallback to closest store: ${closestStore.store._id}, distance = ${closestStore.distance.toFixed(2)} km`);
//             nearestStore = closestStore.store;
//             inventoryWarnings.push(`Fallback store ${closestStore.store._id} may not have all items`);
//         }
//     }

//     if (nearestStore) {
//         console.log(`✅ Nearest store found: ${nearestStore._id}`);
//         if (inventoryWarnings.length > 0) {
//             console.log("⚠️ Inventory warnings:", inventoryWarnings);
//         }
//     } else {
//         console.log("⚠️ No valid store found even as fallback");
//     }

//     return nearestStore;
// }

// // Calculate total amount with wallet points or coupon
// async function calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId) {
//     let totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

//     if (walletPoint > 0) {
//         if (totalAmount >= 500) {
//             if (customer.wallet >= walletPoint) {
//                 totalAmount -= walletPoint;
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
//         if (!coupon) {
//             throw new ApiError(400, "Invalid coupon ID");
//         }
//         if (coupon.expiryDate < new Date()) {
//             throw new ApiError(400, "Coupon has expired");
//         }
//         if (coupon.limit <= 0) {
//             throw new ApiError(400, "Coupon limit reached");
//         }
//         const discountAmount = (totalAmount * coupon.discount) / 100;
//         totalAmount -= discountAmount;
//         await Coupons.findByIdAndUpdate(couponsId, { $inc: { limit: -1 } });
//     }

//     return totalAmount;
// }

// // Prepare order data by fetching stores and subcategories
// async function prepareOrderData(customer, latitude, longitude, pincode) {
//     const candidateStores = await Store.find({ isActive: true })
//         .populate("manager", "_id");

//     if (!candidateStores.length) {
//         throw new ApiError(404, "No active stores found");
//     }

//     const subCategories = await SubCategory.find({
//         _id: { $in: customer.orders.map(item => item.subCategory) }
//     });

//     const orderItems = customer.orders.map(item => ({
//         name: item.subCategory.name,
//         quantity: item.count,
//         price: item.subCategory.discountPrice || item.subCategory.price,
//         subCategory: item.subCategory
//     }));

//     console.log("🚀 ~ prepareOrderData ~ orderItems:", JSON.stringify(orderItems, null, 2));
//     console.log("🚀 ~ prepareOrderData ~ subCategories:", JSON.stringify(subCategories, null, 2));

//     const nearestStore = await getNearestStore(
//         candidateStores,
//         latitude,
//         longitude,
//         pincode,
//         customer.orders,
//         subCategories
//     );

//     if (!nearestStore) {
//         throw new ApiError(404, "No nearby store found (even as fallback)");
//     }

//     if (!nearestStore.manager || !nearestStore.manager._id) {
//         throw new ApiError(404, "Nearest store has no assigned manager");
//     }
//     const manager = await Manager.findById(nearestStore.manager._id);
//     if (!manager) {
//         throw new ApiError(404, "Manager not found for nearest store");
//     }

//     return { nearestStore, orderItems };
// }

// export const createOrder = asyncHandler(async (req, res) => {
//     const { userId } = req.params;
//     const { location, phone, latitude, longitude, notes, isUrgent, pincode, walletPoint, couponsId } = req.body;

//     // Validate userId
//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//         throw new ApiError(400, "Invalid customer ID");
//     }

//     // Fetch customer with selected address and populated orders
//     const customer = await Customer.findById(userId)
//         .populate("orders.subCategory")
//         .select("name phone orders orderHistory wallet address");
//     if (!customer) {
//         throw new ApiError(404, "Customer not found");
//     }
//     if (!customer.orders?.length) {
//         throw new ApiError(400, "Cart is empty");
//     }

//     // Get selected address for pincode
//     const selectedAddress = customer.address.find(addr => addr.isSelected);
//     if (!selectedAddress && !pincode) {
//         throw new ApiError(400, "No selected address found and no pincode provided");
//     }

//     // Use provided pincode or fallback to selected address pincode
//     const orderPincode = pincode || selectedAddress?.pincode;

//     // Validate lat/long
//     if (latitude == null || longitude == null) {
//         throw new ApiError(400, "Latitude and Longitude are required");
//     }

//     // Prepare order data
//     const { nearestStore, orderItems } = await prepareOrderData(customer, latitude, longitude, orderPincode);

//     // Calculate total amount
//     const totalAmount = await calculateTotalAmount(customer, orderItems, walletPoint, couponsId, userId);

//     // Create new order
//     const newOrder = await Order.create({
//         customer: customer._id,
//         clientName: customer.name || "Guest",
//         location: location || selectedAddress
//             ? `${selectedAddress.houseNo}, ${selectedAddress.street}, ${selectedAddress.city}`
//             : "Unknown",
//         pincode: orderPincode || nearestStore.pincode,
//         geoLocation: { type: "Point", coordinates: [longitude, latitude] },
//         orderDetails: orderItems,
//         phone: phone || customer.phone,
//         amount: totalAmount,
//         store: nearestStore._id,
//         manager: nearestStore.manager._id,
//         notes: notes || "",
//         isUrgent: !!isUrgent,
//         reason: nearestStore.reason || "nearest place",
//         customerLat: latitude,
//         customerLong: longitude
//     });

//     // Move cart items to order history
//     if (!Array.isArray(customer.orderHistory)) {
//         customer.orderHistory = [];
//     }
//     customer.orders.forEach(item => {
//         customer.orderHistory.push({
//             order: newOrder._id,
//             orderedAt: item.orderedAt
//         });
//     });

//     // Clear customer's cart
//     customer.orders = [];
//     await customer.save();

//     // Update subcategory inventory
//     for (const item of orderItems) {
//         const updateResult = await SubCategory.updateOne(
//             {
//                 _id: item.subCategory._id,
//                 "quantity.managerId": nearestStore.manager._id
//             },
//             {
//                 $inc: {
//                     "quantity.$.count": -item.quantity
//                 }
//             }
//         );
//         if (updateResult.matchedCount === 0) {
//             console.log(`⚠️ Warning: SubCategory ${item.subCategory._id} inventory not found for manager ${nearestStore.manager._id}, proceeding anyway`);
//         }
//     }

//     // Fetch store details for response
//     const storeDetails = await Store.findById(nearestStore._id)
//         .populate("manager", "firstName lastName phone");

//     return res
//         .status(201)
//         .json(new ApiResponse(201, {
//             order: newOrder,
//             store: {
//                 id: storeDetails._id,
//                 name: storeDetails.name,
//                 location: storeDetails.location,
//                 pincode: storeDetails.pincode,
//                 latitude: storeDetails.lat,
//                 longitude: storeDetails.long,
//                 manager: {
//                     id: storeDetails.manager._id,
//                     firstName: storeDetails.manager.firstName,
//                     lastName: storeDetails.manager.lastName,
//                     phone: storeDetails.manager.phone
//                 }
//             }
//         }, "Order created successfully"));
// });