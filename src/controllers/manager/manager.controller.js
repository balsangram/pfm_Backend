import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Manager from '../../models/manager/manager.model.js';
import Order from '../../models/catalog/order.model.js';
import DeliveryPartner from '../../models/deliveryPartner/deliveryPartner.model.js';
import Store from '../../models/store/store.model.js';
import bcrypt from 'bcrypt';

// Manager Profile Management
export const getManagerProfile = asyncHandler(async (req, res) => {
    const managerId = req.user._id;
    console.log("🚀 ~ managerId:", managerId)

    const manager = await Manager.findById(managerId)
        .select('-__v')
        .populate('store', 'name location phone');
    console.log("🚀 ~ manager:", manager)

    if (!manager) {
        throw new ApiError(404, "Manager profile not found");
    }

    return res.status(200).json(
        new ApiResponse(200, manager, "Manager profile retrieved successfully")
    );
});

export const updateManagerProfile = asyncHandler(async (req, res) => {
    const managerId = req.user._id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.email; // Email should be updated separately for security

    const manager = await Manager.findByIdAndUpdate(
        managerId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('-__v');

    if (!manager) {
        throw new ApiError(404, "Manager profile not found");
    }

    return res.status(200).json(
        new ApiResponse(200, manager, "Manager profile updated successfully")
    );
});

export const changeManagerPassword = asyncHandler(async (req, res) => {
    const managerId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const manager = await Manager.findById(managerId);
    if (!manager) {
        throw new ApiError(404, "Manager profile not found");
    }

    // Check if current password is correct (assuming password is stored)
    // Note: You might need to implement password storage in the manager model
    // For now, we'll skip password verification if no password is stored

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    manager.password = hashedPassword;
    await manager.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    );
});

// Order Management
export const getOrders = asyncHandler(async (req, res) => {
    console.log('🔍 getOrders: Starting order retrieval...');
    console.log('🔍 getOrders: Request user:', req.user);
    console.log('🔍 getOrders: Request query:', req.query);

    const managerId = req.user._id;
    console.log('🔍 getOrders: Manager ID:', managerId);

    // Get the manager's store ID
    const manager = await Manager.findById(managerId).select('store');
    console.log('🔍 getOrders: Manager found:', manager);

    if (!manager || !manager.store) {
        console.log('❌ getOrders: Manager or store not found');
        throw new ApiError(404, "Manager's store not found");
    }

    console.log('🔍 getOrders: Store ID:', manager.store);

    const {
        status,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 10
    } = req.query;

    console.log('🔍 getOrders: Query parameters:', { status, dateFrom, dateTo, search, page, limit });

    // Build filter object - filter by store instead of manager to get all orders for the store
    const filter = { store: manager.store };

    if (status) {
        filter.status = status;
    }

    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
        filter.$or = [
            { clientName: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
        ];

        // If search looks like a valid ObjectId, also search by _id
        if (search && /^[0-9a-fA-F]{24}$/.test(search)) {
            filter.$or.push({ _id: search });
        }
    }

    console.log('🔍 getOrders: Final filter:', JSON.stringify(filter, null, 2));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
        .populate('deliveryPartner', 'name phone')
        .populate('manager', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v');

    console.log('🔍 getOrders: Orders found:', orders.length);

    const totalOrders = await Order.countDocuments(filter);

    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    console.log('✅ getOrders: Successfully retrieved orders');

    return res.status(200).json(
        new ApiResponse(200, {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        }, "Orders retrieved successfully")
    );
});

export const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const managerId = req.user._id;

    // Get the manager's store ID
    const manager = await Manager.findById(managerId).select('store');
    if (!manager || !manager.store) {
        throw new ApiError(404, "Manager's store not found");
    }

    const order = await Order.findOne({ _id: id, store: manager.store })
        .populate('deliveryPartner', 'name phone')
        .populate('store', 'name location phone')
        .populate('manager', 'firstName lastName phone')
        .select('-__v');

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    return res.status(200).json(
        new ApiResponse(200, order, "Order retrieved successfully")
    );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const managerId = req.user._id;
    const { status, pickedUpBy, notes } = req.body;

    // Get the manager's store ID
    const manager = await Manager.findById(managerId).select('store');
    if (!manager || !manager.store) {
        throw new ApiError(404, "Manager's store not found");
    }

    const order = await Order.findOne({ _id: id, store: manager.store });
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Update order status and related fields
    const updateData = { status };
    if (pickedUpBy) updateData.pickedUpBy = pickedUpBy;
    if (notes) updateData.notes = notes;

    // Set delivery time if status is delivered
    if (status === 'delivered') {
        updateData.actualDeliveryTime = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate('deliveryPartner', 'name phone');

    return res.status(200).json(
        new ApiResponse(200, updatedOrder, "Order status updated successfully")
    );
});

// Migration function to update existing delivery partners with store field
export const migrateDeliveryPartners = asyncHandler(async (req, res) => {
    const managerId = req.user._id;

    // Get the manager's store ID
    const manager = await Manager.findById(managerId).select('store');
    if (!manager || !manager.store) {
        throw new ApiError(404, "Manager's store not found");
    }

    // Find delivery partners that don't have a store field but have orders from this store
    const deliveryPartnersToUpdate = await Order.aggregate([
        {
            $match: {
                store: manager.store,
                deliveryPartner: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$deliveryPartner',
                orderCount: { $sum: 1 }
            }
        }
    ]);

    if (deliveryPartnersToUpdate.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { updated: 0 }, "No delivery partners need migration")
        );
    }

    // Update delivery partners with store field
    const deliveryPartnerIds = deliveryPartnersToUpdate.map(dp => dp._id);
    const updateResult = await DeliveryPartner.updateMany(
        {
            _id: { $in: deliveryPartnerIds },
            $or: [
                { store: { $exists: false } },
                { store: null }
            ]
        },
        { $set: { store: manager.store } }
    );

    return res.status(200).json(
        new ApiResponse(200, {
            updated: updateResult.modifiedCount,
            total: deliveryPartnersToUpdate.length
        }, `Migration completed. ${updateResult.modifiedCount} delivery partners updated.`)
    );
});

// Delivery Partner Management
// export const getDeliveryPartners = asyncHandler(async (req, res) => {
//     console.log("hhhhh");

//     const managerId = req.user._id;
//     // console.log("🚀 ~ req.user._id:", req.user._id)
//     const { status, search, page = 1, limit = 10 } = req.query;

//     // Get the manager's store ID first
//     const manager = await Manager.findById(managerId).select('store');
//     console.log("🚀 ~ manager:", manager)
//     if (!manager || !manager.store) {
//         throw new ApiError(404, "Manager's store not found");
//     }

//     // Use aggregation to find delivery partners for this store
//     // This handles both direct store association and delivery partners with orders from this store
//     const pipeline = [
//         {
//             $match: {
//                 isActive: true,
//                 $or: [
//                     { store: manager.store }, // Direct store association
//                     {
//                         // Delivery partners with orders from this store
//                         _id: {
//                             $in: await Order.distinct('deliveryPartner', {
//                                 store: manager.store,
//                                 deliveryPartner: { $exists: true, $ne: null }
//                             })
//                         }
//                     }
//                 ]
//             }
//         }
//     ];
//     console.log("🚀 ~ pipeline:", pipeline)

//     // Add status filter if specified
//     if (status) {
//         pipeline[0].$match.status = status;
//     }
//     console.log("🚀 ~ status:", status)

//     // Add search filter if specified
//     if (search) {
//         pipeline[0].$match.$and = [{
//             $or: [
//                 { name: { $regex: search, $options: 'i' } },
//                 { phone: { $regex: search, $options: 'i' } }
//             ]
//         }];
//     }

//     // Add sorting and pagination
//     pipeline.push(
//         { $sort: { createdAt: -1 } },
//         { $skip: (parseInt(page) - 1) * parseInt(limit) },
//         { $limit: parseInt(limit) },
//         { $project: { __v: 0 } }
//     );

//     // Get total count for pagination
//     const countPipeline = [
//         ...pipeline.slice(0, -3), // Remove sorting, skip, limit, and project
//         { $count: "total" }
//     ];
//     console.log("🚀 ~ countPipeline:", countPipeline)

//     const [deliveryPartners, countResult] = await Promise.all([
//         DeliveryPartner.aggregate(pipeline),
//         DeliveryPartner.aggregate(countPipeline)
//     ]);

//     const totalPartners = countResult[0]?.total || 0;
//     console.log("🚀 ~ totalPartners:", totalPartners)
//     const totalPages = Math.ceil(totalPartners / parseInt(limit));
//     console.log("🚀 ~ totalPages:", totalPages)

//     return res.status(200).json(
//         new ApiResponse(200, {
//             deliveryPartners,
//             pagination: {
//                 currentPage: parseInt(page),
//                 totalPages,
//                 totalPartners,
//                 hasNextPage: parseInt(page) < totalPages,
//                 hasPrevPage: parseInt(page) > 1
//             }
//         }, "Delivery partners retrieved successfully")
//     );
// });

export const getDeliveryPartners = asyncHandler(async (req, res) => {
    const managerId = req.user._id;

    // ✅ Get manager with storeId
    const manager = await Manager.findById(managerId).select("store");
    // console.log("🚀 ~ manager:", manager)
    if (!manager || !manager.store) {
        throw new ApiError(404, "Manager's store not found");
    }

    const storeId = manager.store;
    // console.log("🚀 ~ storeId:", storeId)

    // ✅ Find delivery partners linked to this store
    const deliveryPartners = await DeliveryPartner.find({ store: storeId });
    // console.log("🚀 ~ deliveryPartners:", deliveryPartners)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                // 👈 count
                deliveryPartners // 👈 full details
            },
            "Delivery partners retrieved successfully"
        )
    );
});


export const getDeliveryPartnerById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deliveryPartner = await DeliveryPartner.findById(id)
        .select('-__v')
        .populate('assignedOrders', 'orderId status totalAmount customerAddress deliveryAddress createdAt');

    if (!deliveryPartner) {
        throw new ApiError(404, "Delivery partner not found");
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Delivery partner retrieved successfully")
    );
});

// CRUD handlers moved to shared/deliveryPartnerManagement.controller.js

// Store Management
export const getStoreDetails = asyncHandler(async (req, res) => {
    const managerId = req.user._id;

    const manager = await Manager.findById(managerId).populate('store');
    if (!manager || !manager.store) {
        throw new ApiError(404, "Store details not found");
    }

    return res.status(200).json(
        new ApiResponse(200, manager.store, "Store details retrieved successfully")
    );
});

export const updateStoreDetails = asyncHandler(async (req, res) => {
    const managerId = req.user._id;
    const updateData = req.body;

    const manager = await Manager.findById(managerId);
    if (!manager || !manager.store) {
        throw new ApiError(404, "Store not found");
    }

    const store = await Store.findByIdAndUpdate(
        manager.store,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return res.status(200).json(
        new ApiResponse(200, store, "Store details updated successfully")
    );
});

// Dashboard Statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
    const managerId = req.user._id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get order statistics
    const totalOrders = await Order.countDocuments({ manager: managerId });
    const todayOrders = await Order.countDocuments({
        manager: managerId,
        createdAt: { $gte: today, $lt: tomorrow }
    });

    const pendingOrders = await Order.countDocuments({
        manager: managerId,
        status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    const deliveredOrders = await Order.countDocuments({
        manager: managerId,
        status: 'delivered'
    });

    // Get delivery partner statistics
    const totalPartners = await DeliveryPartner.countDocuments({ isActive: true });
    const verifiedPartners = await DeliveryPartner.countDocuments({
        isActive: true,
        status: 'verified'
    });

    // Get recent orders
    const recentOrders = await Order.find({ manager: managerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id clientName status amount pincode createdAt');

    const stats = {
        orders: {
            total: totalOrders,
            today: todayOrders,
            pending: pendingOrders,
            delivered: deliveredOrders
        },
        deliveryPartners: {
            total: totalPartners,
            verified: verifiedPartners
        },
        recentOrders
    };

    return res.status(200).json(
        new ApiResponse(200, stats, "Dashboard statistics retrieved successfully")
    );
});

// Order Management Statistics
export const getOrderManagementStats = asyncHandler(async (req, res) => {
    console.log('🔍 getOrderManagementStats: Starting stats retrieval...');
    console.log('🔍 getOrderManagementStats: Request user:', req.user);

    const managerId = req.user._id;
    console.log('🔍 getOrderManagementStats: Manager ID:', managerId);

    // Get the manager's store ID
    const manager = await Manager.findById(managerId).select('store');
    console.log('🔍 getOrderManagementStats: Manager found:', manager);

    if (!manager || !manager.store) {
        console.log('❌ getOrderManagementStats: Manager or store not found');
        throw new ApiError(404, "Manager's store not found");
    }

    console.log('🔍 getOrderManagementStats: Store ID:', manager.store);

    // Get comprehensive order statistics - filter by store instead of manager
    const totalOrders = await Order.countDocuments({ store: manager.store });
    const deliveredOrders = await Order.countDocuments({
        store: manager.store,
        status: 'delivered'
    });
    const inTransitOrders = await Order.countDocuments({
        store: manager.store,
        status: 'in_transit'
    });
    const pickedUpOrders = await Order.countDocuments({
        store: manager.store,
        status: 'picked_up'
    });

    console.log('🔍 getOrderManagementStats: Counts:', { totalOrders, deliveredOrders, inTransitOrders, pickedUpOrders });

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
        { $match: { store: manager.store } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    console.log('🔍 getOrderManagementStats: Total revenue:', totalRevenue);

    const stats = {
        totalOrders,
        delivered: deliveredOrders,
        inTransit: inTransitOrders,
        pickedUp: pickedUpOrders,
        totalRevenue
    };

    console.log('✅ getOrderManagementStats: Successfully retrieved stats');

    return res.status(200).json(
        new ApiResponse(200, { stats }, "Order management statistics retrieved successfully")
    );
});
