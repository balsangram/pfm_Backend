import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import DeliveryPartner from "../../models/deliveryPartner/deliveryPartner.model.js";

// Get delivery partner profile
export const getDeliveryPartnerProfile = asyncHandler(async (req, res) => {
    const deliveryPartnerId = req.user.userId;

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
    const deliveryPartnerId = req.user.userId;
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
    const deliveryPartnerId = req.user.userId;

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
    const deliveryPartnerId = req.user.userId;
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
    const deliveryPartnerId = req.user.userId;

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
    const deliveryPartnerId = req.user.userId;

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
    const deliveryPartnerId = req.user.userId;

    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId)
        .populate('assignedOrders', 'orderId status totalAmount customerAddress deliveryAddress createdAt');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner.assignedOrders, "Assigned orders retrieved successfully")
    );
});
