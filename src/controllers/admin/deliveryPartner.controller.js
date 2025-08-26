import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import DeliveryPartner from "../../models/deliveryPartner/deliveryPartner.model.js";
import mongoose from "mongoose";
import Store from "../../models/store/store.model.js"

// Create new delivery partner
// export const createDeliveryPartner = asyncHandler(async (req, res) => {
//     const { name, phone } = req.body;

//     // Validate required fields
//     if (!name || !phone) {
//         return res.status(400).json(
//             new ApiResponse(400, null, "Name and phone are required")
//         );
//     }

//     // Check if phone is already registered
//     const existingPartner = await DeliveryPartner.findOne({ phone });
//     if (existingPartner) {
//         return res.status(400).json(
//             new ApiResponse(400, null, "Phone number is already registered")
//         );
//     }

//     // Create new delivery partner with default values
//     const newDeliveryPartner = await DeliveryPartner.create({
//         name,
//         phone,
//         status: 'pending', // Default status
//         documentStatus: {
//             idProof: 'pending',
//             addressProof: 'pending',
//             vehicleDocuments: 'pending',
//             drivingLicense: 'pending',
//             insuranceDocuments: 'pending'
//         },
//         overallDocumentStatus: 'pending',
//         isActive: false, // Inactive until documents are verified
//         totalDeliveries: 0,
//         totalAccepted: 0,
//         totalRejected: 0,
//         rating: 0
//     });

//     return res.status(201).json(
//         new ApiResponse(201, newDeliveryPartner, "Delivery partner created successfully")
//     );
// });

const createDeliveryPartner = asyncHandler(async (req, res) => {
    const { name, phone, storeId } = req.body;
    console.log("🚀 ~ req.body:", req.body);

    if (!name || !phone) {
        return res.status(400).json(new ApiResponse(400, null, "Name and phone are required"));
    }

    const existingPartner = await DeliveryPartner.findOne({ phone });
    if (existingPartner) {
        return res.status(400).json(new ApiResponse(400, null, "Phone number is already registered"));
    }

    let storeObjectId = null; // ✅ just assign, no ": string | null"

    if (storeId) {
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid store ID"));
        }

        const existingStore = await Store.findById(storeId);
        if (!existingStore) {
            return res.status(404).json(new ApiResponse(404, null, "Store not found"));
        }

        // ✅ Convert ObjectId to string
        storeObjectId = existingStore._id.toString();
    }

    const newDeliveryPartner = await DeliveryPartner.create({
        name,
        phone,
        store: storeObjectId, // store as string
        status: 'pending',
        documentStatus: {
            idProof: 'pending',
            addressProof: 'pending',
            vehicleDocuments: 'pending',
            drivingLicense: 'pending',
            insuranceDocuments: 'pending'
        },
        overallDocumentStatus: 'pending',
        isActive: false,
        totalDeliveries: 0,
        totalAccepted: 0,
        totalRejected: 0,
        rating: 0
    });

    return res.status(201).json(
        new ApiResponse(201, newDeliveryPartner, "Delivery partner created successfully")
    );
});

// export const createDeliveryPartner = asyncHandler(async (req, res) => {
//     const { name, phone, store } = req.body; // 👈 include store

//     // Validate required fields
//     if (!name || !phone) {
//         return res.status(400).json(
//             new ApiResponse(400, null, "Name and phone are required")
//         );
//     }

//     // Check if phone is already registered
//     const existingPartner = await DeliveryPartner.findOne({ phone });
//     if (existingPartner) {
//         return res.status(400).json(
//             new ApiResponse(400, null, "Phone number is already registered")
//         );
//     }

//     // Create new delivery partner with default values
//     const newDeliveryPartner = await DeliveryPartner.create({
//         name,
//         phone,
//         store: store || null, // 👈 optional, will save null if not provided
//         status: 'pending',
//         documentStatus: {
//             idProof: 'pending',
//             addressProof: 'pending',
//             vehicleDocuments: 'pending',
//             drivingLicense: 'pending',
//             insuranceDocuments: 'pending'
//         },
//         overallDocumentStatus: 'pending',
//         isActive: false,
//         totalDeliveries: 0,
//         totalAccepted: 0,
//         totalRejected: 0,
//         rating: 0
//     });

//     return res.status(201).json(
//         new ApiResponse(201, newDeliveryPartner, "Delivery partner created successfully")
//     );
// });


// Get all delivery partners with filtering and pagination
const getAllDeliveryPartners = asyncHandler(async (req, res) => {
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

// update paqrtner 

// Update delivery partner status
const updateDeliveryPartnerStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log("🚀 ~ req.body:", req.body)

    if (!status || !['verified', 'pending'].includes(status)) {
        return res.status(400).json(
            new ApiResponse(400, null, "Valid status (verified/pending) is required")
        );
    }

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    ).select('-__v');

    console.log("🚀 ~ deliveryPartner:", deliveryPartner)
    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Delivery partner status updated successfully")
    );
});

// Update document verification status
export const updateDocumentVerificationStatus = asyncHandler(async (req, res) => {
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

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).select('-__v');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Document verification status updated successfully")
    );
});

// Bulk update document verification status
export const bulkUpdateDocumentVerification = asyncHandler(async (req, res) => {
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

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        finalUpdateData,
        { new: true, runValidators: true }
    ).select('-__v');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Document verification statuses updated successfully")
    );
});

// Delete delivery partner
export const deleteDeliveryPartner = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deliveryPartner = await DeliveryPartner.findByIdAndDelete(id);

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Delivery partner deleted successfully")
    );
});

// Get delivery partner statistics
export const getDeliveryPartnerStats = asyncHandler(async (req, res) => {
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

const editDeleveryPArtner = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone, storeId, status } = req.body;

    // Validate status if provided
    if (status && !['verified', 'pending', 'rejected'].includes(status)) {
        return res.status(400).json(
            new ApiResponse(400, null, "Valid status (verified/pending/rejected) is required")
        );
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (storeId) updateData.storeId = storeId;
    if (status) updateData.status = status;

    const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).select('-__v');

    if (!deliveryPartner) {
        return res.status(404).json(
            new ApiResponse(404, null, "Delivery partner not found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, deliveryPartner, "Delivery partner updated successfully")
    );
});


// Export the controller object
export const DeliveryPartnerController = {
    createDeliveryPartner,
    getAllDeliveryPartners,
    getDeliveryPartnerById,
    updateDeliveryPartnerStatus,
    updateDocumentVerificationStatus,
    bulkUpdateDocumentVerification,
    deleteDeliveryPartner,
    getDeliveryPartnerStats,
    editDeleveryPArtner
};
