import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import DeliveryPartner from "../../models/deliveryPartner/deliveryPartner.model.js";
import Order from "../../models/catalog/order.model.js";

// Get delivery partner profile
export const getDeliveryPartnerProfile = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
        .select('-__v')
        .populate('assignedOrders', 'orderId status totalAmount');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Profile retrieved successfully")
    );
});

// Update delivery partner profile
export const updateDeliveryPartnerProfile = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;
    const { name, phone } = req.body;

    // Validate input
    if (!name && !phone) {
        return res.status(400).json(
            new ApiResponse(400, null, "At least one field is required to update")
        );
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // Check if phone is already taken by another delivery partner
    if (phone) {
        const existingPartner = await DeliveryPartner.findOne({ 
            phone, 
            _id: { $ne: deliveryPartnerId } 
        });
        if (existingPartner) {
            return res.status(400).json(
                new ApiResponse(400, null, "Phone number is already registered")
            );
        }
    }

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
        deliveryPartnerId,
        updateData,
        { new: true, runValidators: true }
    ).select('-__v');

    return res.status(200).json(
        new ApiResponse(200, updatedPartner, "Profile updated successfully")
    );
});

// Get document verification status
export const getDocumentStatus = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
        .select('documentStatus overallDocumentStatus verificationNotes status');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {
            documentStatus: deliveryPartner.documentStatus,
            overallDocumentStatus: deliveryPartner.overallDocumentStatus,
            verificationNotes: deliveryPartner.verificationNotes,
            status: deliveryPartner.status
        }, "Document status retrieved successfully")
    );
});

// Upload document for verification (placeholder - you'll need to implement file upload)
export const uploadDocument = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;
    const { documentType, documentUrl } = req.body;

    if (!documentType || !documentUrl) {
        return res.status(400).json(
            new ApiResponse(400, null, "Document type and URL are required")
        );
    }

    const validDocumentTypes = ['idProof', 'addressProof', 'vehicleDocuments', 'drivingLicense', 'insuranceDocuments'];
    
    if (!validDocumentTypes.includes(documentType)) {
        return res.status(400).json(
            new ApiResponse(400, null, "Invalid document type")
        );
    }

    // Here you would typically:
    // 1. Save the document file to cloud storage
    // 2. Update the document status to 'pending'
    // 3. Store the document URL

    return res.status(200).json(
        new ApiResponse(200, null, "Document uploaded successfully and pending verification")
    );
});

// Get delivery statistics
export const getDeliveryStatistics = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
        .select('totalDeliveries totalAccepted totalRejected rating lastActive');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Statistics retrieved successfully")
    );
});

// Update last active status
export const updateLastActive = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    await DeliveryPartner.findByIdAndUpdate(
        deliveryPartnerId,
        { lastActive: new Date() }
    );

    return res.status(200).json(
        new ApiResponse(200, null, "Last active status updated")
    );
});

// Get assigned orders
export const getAssignedOrders = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    // Query orders directly to ensure latest data
    const orders = await Order.find({ deliveryPartner: deliveryPartnerId })
        .select('_id status amount location customerLat customerLong estimatedDeliveryTime actualDeliveryTime createdAt')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, orders, "Assigned orders retrieved successfully")
    );
});

// Scan QR to fetch order details
// Expect QR to contain an order identifier. We support two formats:
// 1) raw Mongo ObjectId of the order
// 2) JSON string like {"orderId":"<mongoId>"}
export const scanOrderQr = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const deliveryPartnerId = req.user._id; // Use _id instead of id

    let resolvedOrderId = null;
    try {
        const maybeObj = JSON.parse(code);
        if (maybeObj && typeof maybeObj === 'object' && maybeObj.orderId) {
            resolvedOrderId = maybeObj.orderId;
        }
    } catch (_) {
        resolvedOrderId = code;
    }

    if (!resolvedOrderId || !/^[0-9a-fA-F]{24}$/.test(resolvedOrderId)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid QR payload"));
    }

    const order = await Order.findById(resolvedOrderId)
        .populate('store', 'name location phone lat long')
        .populate('deliveryPartner', 'name phone')
        .select('-__v');

    if (!order) {
        return res.status(404).json(new ApiResponse(404, null, "Order not found"));
    }

    // Only orders that are ready should be scannable
    if (order.status !== 'ready') {
        return res.status(400).json(new ApiResponse(400, null, "Order is not ready for pickup. Current status: " + order.status));
    }

    // Check if order is already assigned to another delivery partner
    if (order.deliveryPartner && order.deliveryPartner._id.toString() !== deliveryPartnerId.toString()) {
        return res.status(409).json(new ApiResponse(409, null, "Order is already assigned to another delivery partner"));
    }

    return res.status(200).json(new ApiResponse(200, {
        id: order._id,
        orderId: order._id, // Use _id since orderId field doesn't exist
        clientName: order.clientName,
        phone: order.phone,
        amount: order.amount,
        location: order.location,
        pincode: order.pincode,
        items: order.orderDetails,
        status: order.status,
        store: order.store,
        notes: order.notes,
        isUrgent: order.isUrgent
    }, "Order retrieved from QR"));
});

// Delivery partner responds to an order after scanning
export const respondToOrder = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id; // Use _id instead of id
    const { orderId, action } = req.body;

    // Validate order exists and is in correct status
    const existing = await Order.findById(orderId).select('status deliveryPartner pickedUpBy');
    if (!existing) {
        return res.status(404).json(new ApiResponse(404, null, "Order not found"));
    }

    if (existing.status !== 'ready') {
        return res.status(400).json(new ApiResponse(400, null, "Order is not ready for pickup. Current status: " + existing.status));
    }

    if (action === 'reject') {
        // Update delivery partner stats
        await DeliveryPartner.findByIdAndUpdate(deliveryPartnerId, { 
            $inc: { totalRejected: 1 } 
        });
        return res.status(200).json(new ApiResponse(200, { rejected: true }, "Order rejected by delivery partner"));
    }

    // Get delivery partner name for pickedUpBy field
    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId).select('name');
    if (!deliveryPartner) {
        return res.status(404).json(new ApiResponse(404, null, "Delivery partner not found"));
    }

    if (action === 'accept') {
        // Check if order is already assigned to another delivery partner
        if (existing.deliveryPartner && existing.deliveryPartner.toString() !== deliveryPartnerId.toString()) {
            return res.status(409).json(new ApiResponse(409, null, "Order is already assigned to another delivery partner"));
        }

        // Accept the order - atomic update to prevent race conditions
        const updated = await Order.findOneAndUpdate(
            {
                _id: orderId,
                status: 'ready',
                $or: [
                    { deliveryPartner: null },
                    { deliveryPartner: deliveryPartnerId }
                ]
            },
            {
                $set: {
                    deliveryPartner: deliveryPartnerId,
                    pickedUpBy: deliveryPartnerId, // Set the actual delivery partner ID
                    status: 'picked_up',
                    deliveryStatus: 'accepted',
                    pickedUpAt: new Date() // Record pickup timestamp
                }
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(409).json(new ApiResponse(409, null, "Order already assigned or status changed"));
        }

        // Update delivery partner stats and assigned orders
        await DeliveryPartner.findByIdAndUpdate(deliveryPartnerId, {
            $addToSet: { assignedOrders: updated._id },
            $inc: { totalAccepted: 1 }
        });

            return res.status(200).json(new ApiResponse(200, {
        accepted: true,
        order: updated,
        message: "Order accepted successfully"
    }, "Order accepted and assigned to delivery partner"));
    }

    return res.status(400).json(new ApiResponse(400, null, "Invalid action. Must be 'accept' or 'reject'"));
});

// Initiate delivery - called when delivery partner starts navigation
export const initiateDelivery = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;
    const { orderId } = req.body;

    const order = await Order.findOne({
        _id: orderId,
        deliveryPartner: deliveryPartnerId,
        status: 'picked_up'
    });

    if (!order) {
        return res.status(404).json(new ApiResponse(404, null, "Order not found or not authorized"));
    }

    // Update order status and set estimated delivery time (1 hour from now)
    const estimatedDeliveryTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    order.status = 'in_transit';
    order.estimatedDeliveryTime = estimatedDeliveryTime;
    await order.save();

    return res.status(200).json(new ApiResponse(200, {
        orderId: order._id,
        estimatedDeliveryTime: estimatedDeliveryTime,
        customerLat: order.customerLat,
        customerLong: order.customerLong
    }, "Delivery initiated successfully"));
});

// Mark order as delivered
export const markOrderDelivered = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;
    const { orderId } = req.body;

    const order = await Order.findOne({
        _id: orderId,
        deliveryPartner: deliveryPartnerId,
        status: 'in_transit'
    });

    if (!order) {
        return res.status(404).json(new ApiResponse(404, null, "Order not found or not authorized"));
    }

    // Update order status and delivery time
    order.status = 'delivered';
    order.actualDeliveryTime = new Date();
    await order.save();

    // Update delivery partner stats
    await DeliveryPartner.findByIdAndUpdate(deliveryPartnerId, {
        $inc: { totalDeliveries: 1 }
    });

    return res.status(200).json(new ApiResponse(200, {
        orderId: order._id,
        deliveredAt: order.actualDeliveryTime
    }, "Order marked as delivered successfully"));
});

// Reject delivery with reason
export const rejectDelivery = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;
    const { orderId, reason, notes } = req.body;

    const order = await Order.findOne({
        _id: orderId,
        deliveryPartner: deliveryPartnerId,
        status: { $in: ['picked_up', 'in_transit'] }
    });

    if (!order) {
        return res.status(404).json(new ApiResponse(404, null, "Order not found or not authorized"));
    }

    // Update order status and rejection details
    order.status = 'cancelled';
    await order.save();

    // Remove from delivery partner's assigned orders
    await DeliveryPartner.findByIdAndUpdate(deliveryPartnerId, {
        $pull: { assignedOrders: order._id },
        $inc: { totalRejected: 1 }
    });

    return res.status(200).json(new ApiResponse(200, {
        orderId: order._id,
        rejectedAt: new Date(),
        reason: reason
    }, "Order rejected successfully"));
});

// Get ongoing orders (picked up but not delivered)
export const getOngoingOrders = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    const ongoingOrders = await Order.find({
        deliveryPartner: deliveryPartnerId,
        status: { $in: ['picked_up', 'in_transit'] }
    }).select('_id clientName location orderDetails amount estimatedDeliveryTime createdAt');

    return res.status(200).json(new ApiResponse(200, ongoingOrders, "Ongoing orders retrieved successfully"));
});

// Get completed orders (delivered)
export const getCompletedOrders = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    const completedOrders = await Order.find({
        deliveryPartner: deliveryPartnerId,
        status: 'delivered'
    }).select('_id clientName location orderDetails amount actualDeliveryTime');

    return res.status(200).json(new ApiResponse(200, completedOrders, "Completed orders retrieved successfully"));
});

// Get store manager contact info for "Contact Us"
export const getStoreManagerContact = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    // Find the delivery partner to get their assigned orders
    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);
    if (!deliveryPartner) {
        return res.status(404).json(new ApiResponse(404, null, "Delivery partner not found"));
    }

    // Get the most recent assigned order to find the store
    const recentOrder = await Order.findOne({ deliveryPartner: deliveryPartnerId })
        .sort({ createdAt: -1 })
        .populate('store', 'name phone location')
        .populate('manager', 'firstName lastName phone');

    if (!recentOrder) {
        return res.status(404).json(new ApiResponse(404, null, "No orders found to determine store contact"));
    }

    return res.status(200).json(new ApiResponse(200, {
        store: {
            name: recentOrder.store.name,
            phone: recentOrder.store.phone,
            location: recentOrder.store.location
        },
        manager: {
            name: `${recentOrder.manager.firstName} ${recentOrder.manager.lastName}`,
            phone: recentOrder.manager.phone
        }
    }, "Store manager contact information retrieved successfully"));
});

// Get comprehensive profile information
export const getProfileInfo = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
        .select('-__v -refreshToken');

    if (!deliveryPartner) {
        return res.status(404).json(new ApiResponse(404, null, "Delivery partner not found"));
    }

    // Get order statistics
    const totalOrders = await Order.countDocuments({ deliveryPartner: deliveryPartnerId });
    const completedOrders = await Order.countDocuments({ 
        deliveryPartner: deliveryPartnerId, 
        status: 'delivered' 
    });
    const ongoingOrders = await Order.countDocuments({ 
        deliveryPartner: deliveryPartnerId, 
        status: { $in: ['picked_up', 'in_transit'] } 
    });

    const profileData = {
        ...deliveryPartner.toObject(),
        orderStats: {
            total: totalOrders,
            completed: completedOrders,
            ongoing: ongoingOrders
        }
    };

    return res.status(200).json(new ApiResponse(200, profileData, "Profile information retrieved successfully"));
});

// Delete delivery partner account
export const deleteAccount = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    // Check if there are any ongoing orders
    const ongoingOrders = await Order.countDocuments({
        deliveryPartner: deliveryPartnerId,
        status: { $in: ['picked_up', 'in_transit'] }
    });

    if (ongoingOrders > 0) {
        return res.status(400).json(new ApiResponse(400, null, "Cannot delete account while having ongoing deliveries"));
    }

    // Remove delivery partner from all assigned orders
    await Order.updateMany(
        { deliveryPartner: deliveryPartnerId },
        { $unset: { deliveryPartner: 1 } }
    );

    // Delete the delivery partner account
    await DeliveryPartner.findByIdAndDelete(deliveryPartnerId);

    return res.status(200).json(new ApiResponse(200, null, "Account deleted successfully"));
});

// Get delivery partner statistics and performance
export const getProfileStats = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
        .select('totalDeliveries totalAccepted totalRejected rating lastActive createdAt');

    if (!deliveryPartner) {
        return res.status(404).json(new ApiResponse(404, null, "Delivery partner not found"));
    }

    // Calculate additional stats
    const totalOrders = deliveryPartner.totalAccepted + deliveryPartner.totalRejected;
    const successRate = totalOrders > 0 ? (deliveryPartner.totalDeliveries / totalOrders * 100).toFixed(2) : 0;

    const stats = {
        ...deliveryPartner.toObject(),
        totalOrders,
        successRate: `${successRate}%`,
        averageRating: deliveryPartner.rating.toFixed(1),
        daysActive: Math.ceil((Date.now() - new Date(deliveryPartner.createdAt)) / (1000 * 60 * 60 * 24))
    };

    return res.status(200).json(new ApiResponse(200, stats, "Profile statistics retrieved successfully"));
});

// Edit delivery partner profile (name)
export const editProfile = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user._id;
    const { name } = req.body;

    // Validate input
    if (!name || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json(new ApiResponse(400, null, "Name must be between 2 and 100 characters"));
    }

    // Check if name is already taken by another delivery partner
    const existingPartner = await DeliveryPartner.findOne({ 
        name: name.trim(), 
        _id: { $ne: deliveryPartnerId } 
    });
    
    if (existingPartner) {
        return res.status(400).json(new ApiResponse(400, null, "This name is already taken by another delivery partner"));
    }

    // Update the name
    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
        deliveryPartnerId,
        { name: name.trim() },
        { new: true, runValidators: true }
    ).select('-__v -refreshToken');

    if (!updatedPartner) {
        return res.status(404).json(new ApiResponse(404, null, "Delivery partner not found"));
    }

    return res.status(200).json(new ApiResponse(200, updatedPartner, "Profile updated successfully"));
});
