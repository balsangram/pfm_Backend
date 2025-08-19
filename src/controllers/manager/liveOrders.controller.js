import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Order from '../../models/catalog/order.model.js';

// Get live orders for TV screen display
export const getLiveOrders = asyncHandler(async (req, res) => {
    const managerId = req.user.id;
    const { status } = req.query;
    
    // Build filter for live orders (orders that are not delivered or cancelled)
    const filter = {
        manager: managerId,
        status: {
            $in: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit']
        }
    };
    
    // If specific status is requested, filter by that status
    if (status && ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit'].includes(status)) {
        filter.status = status;
    }
    
    const liveOrders = await Order.find(filter)
        .populate('deliveryPartner', 'name phone')
        .sort({ 
            // Priority order: urgent first, then by creation time
            isUrgent: -1,
            createdAt: 1 
        })
        .select('orderId clientName location orderDetails amount status pickedUpBy createdAt isUrgent')
        .lean(); // Use lean() for better performance on read-only operations
    
    // Group orders by status for better organization
    const ordersByStatus = {
        pending: [],
        confirmed: [],
        preparing: [],
        ready: [],
        picked_up: [],
        in_transit: []
    };
    
    liveOrders.forEach(order => {
        if (ordersByStatus[order.status]) {
            ordersByStatus[order.status].push(order);
        }
    });
    
    // Calculate summary statistics
    const summary = {
        total: liveOrders.length,
        pending: ordersByStatus.pending.length,
        confirmed: ordersByStatus.confirmed.length,
        preparing: ordersByStatus.preparing.length,
        ready: ordersByStatus.ready.length,
        picked_up: ordersByStatus.picked_up.length,
        in_transit: ordersByStatus.in_transit.length,
        urgent: liveOrders.filter(order => order.isUrgent).length
    };
    
    return res.status(200).json(
        new ApiResponse(200, {
            orders: liveOrders,
            ordersByStatus,
            summary,
            lastUpdated: new Date().toISOString()
        }, "Live orders retrieved successfully")
    );
});

// Get orders by specific status for TV screen
export const getOrdersByStatus = asyncHandler(async (req, res) => {
    const managerId = req.user.id;
    const { status } = req.params;
    
    // Validate status parameter
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status. Must be one of: " + validStatuses.join(', '));
    }
    
    const orders = await Order.find({
        manager: managerId,
        status: status
    })
        .populate('deliveryPartner', 'name phone')
        .sort({ 
            isUrgent: -1,
            createdAt: 1 
        })
        .select('orderId clientName location orderDetails amount status pickedUpBy createdAt isUrgent')
        .lean();
    
    return res.status(200).json(
        new ApiResponse(200, {
            status,
            orders,
            count: orders.length,
            lastUpdated: new Date().toISOString()
        }, `Orders with status '${status}' retrieved successfully`)
    );
});

// Get urgent orders for TV screen
export const getUrgentOrders = asyncHandler(async (req, res) => {
    const managerId = req.user.id;
    
    const urgentOrders = await Order.find({
        manager: managerId,
        isUrgent: true,
        status: {
            $in: ['pending', 'confirmed', 'preparing', 'ready']
        }
    })
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: 1 })
        .select('orderId clientName location orderDetails amount status pickedUpBy createdAt')
        .lean();
    
    return res.status(200).json(
        new ApiResponse(200, {
            orders: urgentOrders,
            count: urgentOrders.length,
            lastUpdated: new Date().toISOString()
        }, "Urgent orders retrieved successfully")
    );
});

// Get order count by status for dashboard display
export const getOrderCounts = asyncHandler(async (req, res) => {
    const managerId = req.user.id;
    
    const counts = await Order.aggregate([
        {
            $match: {
                manager: new Order.base.Types.ObjectId(managerId),
                status: {
                    $in: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled']
                }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    // Convert to object format
    const orderCounts = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        in_transit: 0,
        delivered: 0,
        cancelled: 0
    };
    
    counts.forEach(item => {
        orderCounts[item._id] = item.count;
    });
    
    return res.status(200).json(
        new ApiResponse(200, {
            counts: orderCounts,
            total: Object.values(orderCounts).reduce((sum, count) => sum + count, 0),
            lastUpdated: new Date().toISOString()
        }, "Order counts retrieved successfully")
    );
});
