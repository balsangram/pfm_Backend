import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import DeliveryPartner from "../../models/deliveryPartner/deliveryPartner.model.js";

// Helper function to check if user has permission
const hasPermission = (userRole) => {
    return ['admin', 'manager'].includes(userRole);
};

// Create new delivery partner (shared - accepts phone or phoneNumber)
export const createDeliveryPartner = asyncHandler(async (req, res) => {
    // Check if user has permission
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action")
        );
    }

    const { name } = req.body;
    const phone = req.body.phone || req.body.phoneNumber;

    // Validate required fields
    if (!name || !phone) {
        return res.status(400).json(
            new ApiResponse(400, null, "Name and phone are required")
        );
    }

    // Check if phone is already registered
    const existingPartner = await DeliveryPartner.findOne({ phone });
    if (existingPartner) {
        return res.status(409).json(
            new ApiResponse(409, null, "Delivery partner with this phone number already exists")
        );
    }

    // Get manager's store information if user is a manager
    let storeId = null;

    if (req.userRole === 'manager') {
        const Manager = (await import('../../models/manager/manager.model.js')).default;
        const manager = await Manager.findById(req.user._id).select('store');
        if (manager) {
            storeId = manager.store;
        }
    }

    // Create new delivery partner with manager's store
    const newDeliveryPartner = await DeliveryPartner.create({
        name,
        phone,
        status: 'pending', // Default status
        store: storeId, // Associate with manager's store
        documentStatus: {
            idProof: 'pending',
            addressProof: 'pending',
            vehicleDocuments: 'pending',
            drivingLicense: 'pending',
            insuranceDocuments: 'pending'
        },
        overallDocumentStatus: 'pending',
        isActive: true, // Make newly created partners visible in manager list
        totalDeliveries: 0,
        totalAccepted: 0,
        totalRejected: 0,
        rating: 0
    });

    return res.status(201).json(
        new ApiResponse(201, newDeliveryPartner, "Delivery partner created successfully")
    );
});

// Get all delivery partners with filtering and pagination
export const getAllDeliveryPartners = asyncHandler(async (req, res) => {
    // Check if user has permission
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action")
        );
    }

    const { 
        page = 1, 
        limit = 10, 
        status, 
        overallDocumentStatus,
        search 
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (overallDocumentStatus) filter.overallDocumentStatus = overallDocumentStatus;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    const deliveryPartners = await DeliveryPartner.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await DeliveryPartner.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            deliveryPartners,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        }, "Delivery partners retrieved successfully")
    );
});

// Get delivery partner by ID
export const getDeliveryPartnerById = asyncHandler(async (req, res) => {
    // Check if user has permission
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action")
        );
    }

    const { id } = req.params;

    const deliveryPartner = await DeliveryPartner.findById(id)
        .select('-__v')
        .populate('assignedOrders', 'orderId status totalAmount customerAddress deliveryAddress createdAt');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Delivery partner retrieved successfully")
    );
});

// Update delivery partner status
export const updateDeliveryPartnerStatus = async (req, res) => {
    // Check if user has permission
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action")
        );
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['verified', 'pending'].includes(status)) {
        return res.status(400).json(
            new ApiResponse(400, null, "Invalid status. Allowed values are 'verified' or 'pending'")
        );
    }

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    ).select('-__v');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Delivery partner status updated successfully")
    );
};

// Update delivery partner profile/fields (shared)
export const updateDeliveryPartner = asyncHandler(async (req, res) => {
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action"));
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Normalize phoneNumber -> phone
    if (updateData.phoneNumber) {
        updateData.phone = updateData.phoneNumber;
        delete updateData.phoneNumber;
    }

    if (updateData.phone) {
        const exists = await DeliveryPartner.findOne({ phone: updateData.phone, _id: { $ne: id } });
        if (exists) {
            throw new ApiError(409, "Delivery partner with this phone number already exists");
        }
    }

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('-__v');

    if (!deliveryPartner) {
        throw new ApiError(404, "Delivery partner not found");
    }

    return res.status(200).json(new ApiResponse(200, deliveryPartner, "Delivery partner updated successfully"));
});

// Soft delete (set isActive=false)
export const deleteDeliveryPartner = asyncHandler(async (req, res) => {
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action"));
    }

    const { id } = req.params;
    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deliveryPartner) {
        throw new ApiError(404, "Delivery partner not found");
    }
    return res.status(200).json(new ApiResponse(200, {}, "Delivery partner deleted successfully"));
});

// Hard delete (permanent)
export const hardDeleteDeliveryPartner = asyncHandler(async (req, res) => {
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action"));
    }

    const { id } = req.params;
    const deleted = await DeliveryPartner.findByIdAndDelete(id);
    if (!deleted) {
        throw new ApiError(404, "Delivery partner not found");
    }
    return res.status(200).json(new ApiResponse(200, {}, "Delivery partner permanently deleted"));
});

// Update document verification status
export const updateDocumentVerificationStatus = asyncHandler(async (req, res) => {
    // Check if user has permission
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action")
        );
    }

    const { id } = req.params;
    const { documentType, status, notes } = req.body;

    if (!documentType || !status) {
        return res.status(400).json(
            new ApiResponse(400, null, "Document type and status are required")
        );
    }

    const validDocumentTypes = ['idProof', 'addressProof', 'vehicleDocuments', 'drivingLicense', 'insuranceDocuments'];
    const validStatuses = ['verified', 'pending', 'rejected'];

    if (!validDocumentTypes.includes(documentType)) {
        return res.status(400).json(
            new ApiResponse(400, null, "Invalid document type")
        );
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json(
            new ApiResponse(400, null, "Invalid status")
        );
    }

    const updateData = {
        [`documentStatus.${documentType}`]: status
    };

    if (notes) {
        updateData[`verificationNotes.${documentType}`] = notes;
    }

    let deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).select('-__v');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    // Recompute overallDocumentStatus since findByIdAndUpdate bypasses pre-save hooks
    const docStatuses = deliveryPartner.documentStatus || {};
    const statusValues = Object.values(docStatuses);
    let overall = 'pending';
    if (statusValues.length) {
        if (statusValues.every((s) => s === 'verified')) overall = 'verified';
        else if (statusValues.some((s) => s === 'rejected')) overall = 'rejected';
        else overall = 'pending';
    }
    if (deliveryPartner.overallDocumentStatus !== overall || (overall === 'verified' && deliveryPartner.status !== 'verified')) {
        const updateFields = { overallDocumentStatus: overall };
        if (overall === 'verified') {
            updateFields.status = 'verified';
            updateFields.isActive = true;
        }
        deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        ).select('-__v');
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Document verification status updated successfully")
    );
});

// Bulk update document verification status
export const bulkUpdateDocumentVerification = asyncHandler(async (req, res) => {
    // Check if user has permission
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action")
        );
    }

    const { id } = req.params;
    const { documents } = req.body;

    if (!Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json(
            new ApiResponse(400, null, "Documents array is required")
        );
    }

    const updateData = {};
    const notesData = {};

    for (const doc of documents) {
        const { documentType, status, notes } = doc;
        
        if (!documentType || !status) {
            return res.status(400).json(
                new ApiResponse(400, null, "Document type and status are required for each document")
            );
        }

        const validDocumentTypes = ['idProof', 'addressProof', 'vehicleDocuments', 'drivingLicense', 'insuranceDocuments'];
        const validStatuses = ['verified', 'pending', 'rejected'];

        if (!validDocumentTypes.includes(documentType)) {
            return res.status(400).json(
                new ApiResponse(400, null, `Invalid document type: ${documentType}`)
            );
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json(
                new ApiResponse(400, null, `Invalid status: ${status}`)
            );
        }

        updateData[`documentStatus.${documentType}`] = status;
        if (notes) {
            notesData[`verificationNotes.${documentType}`] = notes;
        }
    }

    // Merge both update objects
    const finalUpdateData = { ...updateData, ...notesData };

    let deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        finalUpdateData,
        { new: true, runValidators: true }
    ).select('-__v');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    // Recompute overallDocumentStatus as pre-save hooks don't run on findByIdAndUpdate
    const docStatuses = deliveryPartner.documentStatus || {};
    const statusValues = Object.values(docStatuses);
    let overall = 'pending';
    if (statusValues.length) {
        if (statusValues.every((s) => s === 'verified')) overall = 'verified';
        else if (statusValues.some((s) => s === 'rejected')) overall = 'rejected';
        else overall = 'pending';
    }
    if (deliveryPartner.overallDocumentStatus !== overall || (overall === 'verified' && deliveryPartner.status !== 'verified')) {
        const updateFields = { overallDocumentStatus: overall };
        if (overall === 'verified') {
            updateFields.status = 'verified';
            updateFields.isActive = true;
        }
        deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        ).select('-__v');
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Document verification statuses updated successfully")
    );
});

// (Note) Another delete handler existed here previously; removed to avoid duplicate export

// Get delivery partner statistics
export const getDeliveryPartnerStats = asyncHandler(async (req, res) => {
    // Check if user has permission
    if (!hasPermission(req.userRole)) {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied. Only admins and managers can perform this action")
        );
    }

    const stats = await DeliveryPartner.aggregate([
        {
            $group: {
                _id: null,
                totalPartners: { $sum: 1 },
                verifiedPartners: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
                pendingPartners: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                verifiedDocuments: { $sum: { $cond: [{ $eq: ['$overallDocumentStatus', 'verified'] }, 1, 0] } },
                pendingDocuments: { $sum: { $cond: [{ $eq: ['$overallDocumentStatus', 'pending'] }, 1, 0] } },
                rejectedDocuments: { $sum: { $cond: [{ $eq: ['$overallDocumentStatus', 'rejected'] }, 1, 0] } },
                activePartners: { $sum: { $cond: ['$isActive', 1, 0] } }
            }
        }
    ]);

    const result = stats[0] || {
        totalPartners: 0,
        verifiedPartners: 0,
        pendingPartners: 0,
        verifiedDocuments: 0,
        pendingDocuments: 0,
        rejectedDocuments: 0,
        activePartners: 0
    };

    return res.status(200).json(
        new ApiResponse(200, result, "Statistics retrieved successfully")
    );
});
