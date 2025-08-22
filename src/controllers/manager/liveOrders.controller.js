import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Order from '../../models/catalog/order.model.js';

// Get live orders for TV screen display
export const getLiveOrders = asyncHandler(async (req, res) => {
    console.log('🚀 getLiveOrders endpoint called!');
    console.log('🚀 Request received at:', new Date().toISOString());
    
    // Debug: Check the entire request
    console.log('🔍 Full request headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 req.user exists?', !!req.user);
    console.log('🔍 req.user type:', typeof req.user);
    console.log('🔍 req.user keys:', req.user ? Object.keys(req.user) : 'No user');
    
    const managerId = req.user._id;
    const { status } = req.query;
    
    // Debug logging
    console.log('🔍 Manager ID from token:', managerId);
    console.log('🔍 Manager ID type:', typeof managerId);
    console.log('🔍 Manager ID stringified:', JSON.stringify(managerId));
    
    // Build filter for live orders (orders that are not delivered or cancelled)
    const filter = {
        manager: managerId,
        status: {
            $in: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit']
        }
    };
    
    console.log('🔍 Filter being used:', JSON.stringify(filter, null, 2));
    
    // Debug: Try different filter approaches
    console.log('🔍 Trying filter with string conversion...');
    const filterWithString = {
        manager: managerId.toString(),
        status: {
            $in: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit']
        }
    };
    console.log('🔍 Filter with string conversion:', JSON.stringify(filterWithString, null, 2));
    
    // Try both filters
    const liveOrdersWithString = await Order.find(filterWithString).select('_id clientName status').lean();
    console.log('🔍 Orders found with string filter:', liveOrdersWithString.length);
    
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
        .select('_id clientName location pincode orderDetails amount status pickedUpBy createdAt isUrgent')
        .lean(); // Use lean() for better performance on read-only operations
    
    console.log('🔍 Orders found:', liveOrders.length);
    console.log('🔍 Orders:', JSON.stringify(liveOrders, null, 2));
    
    // Debug: Check all orders for this manager
    const allOrdersForManager = await Order.find({ manager: managerId }).select('_id status clientName createdAt').lean();
    console.log('🔍 All orders for manager (any status):', allOrdersForManager.length);
    console.log('🔍 All orders:', JSON.stringify(allOrdersForManager, null, 2));
    
    // Debug: Check if there are any orders in the database at all
    const totalOrdersInDB = await Order.countDocuments({});
    console.log('🔍 Total orders in database:', totalOrdersInDB);
    
    // Debug: Check the specific order we know exists
    const specificOrder = await Order.findById('68a82c488fb9ce365e995a87').select('_id manager status clientName').lean();
    console.log('🔍 Specific order check:', specificOrder ? JSON.stringify(specificOrder, null, 2) : 'Order not found');
    
    // Debug: Check if manager ID matches the order's manager ID
    if (specificOrder) {
        console.log('🔍 Order manager ID:', specificOrder.manager);
        console.log('🔍 Logged-in manager ID:', managerId);
        console.log('🔍 IDs match?', specificOrder.manager.toString() === managerId.toString());
    }
    
    // Debug: Check what manager is currently logged in
    console.log('🔍 Full req.user object:', JSON.stringify(req.user, null, 2));
    console.log('🔍 req.user._id:', req.user._id);
    console.log('🔍 req.user.id:', req.user.id);
    
    // Debug: Check all managers in the system
    try {
        const Manager = (await import('../../models/manager/manager.model.js')).default;
        const allManagers = await Manager.find({}).select('_id name phone store').lean();
        console.log('🔍 All managers in system:', JSON.stringify(allManagers, null, 2));
        
        // Check if the logged-in manager exists
        const currentManager = allManagers.find(m => m._id.toString() === managerId.toString());
        console.log('🔍 Current logged-in manager found?', !!currentManager);
        if (currentManager) {
            console.log('🔍 Current manager details:', JSON.stringify(currentManager, null, 2));
        }
    } catch (error) {
        console.error('🔍 Error checking managers:', error);
    }
    
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
    const managerId = req.user._id;
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
        .select('_id clientName location pincode orderDetails amount status pickedUpBy createdAt isUrgent')
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
    const managerId = req.user._id;
    
    const urgentOrders = await Order.find({
        manager: managerId,
        isUrgent: true,
        status: {
            $in: ['pending', 'confirmed', 'preparing', 'ready']
        }
    })
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: 1 })
        .select('_id clientName location pincode orderDetails amount status pickedUpBy createdAt')
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
// Simple test endpoint
export const testEndpoint = asyncHandler(async (req, res) => {
    console.log('🧪 Test endpoint called!');
    return res.status(200).json(
        new ApiResponse(200, { message: 'Test endpoint working!' }, "Test successful")
    );
});

export const getOrderCounts = asyncHandler(async (req, res) => {
    const managerId = req.user._id;
    
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
