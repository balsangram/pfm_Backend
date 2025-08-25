import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Store from '../../models/store/store.model.js';
import Manager from '../../models/manager/manager.model.js';

// Get all meat centers
export const getMeatCenters = asyncHandler(async (req, res) => {
    const stores = await Store.find({ isActive: true })
        .populate('manager', 'firstName lastName phone email')
        .select('-__v');

    return res.status(200).json(
        new ApiResponse(200, stores, "Meat centers retrieved successfully")
    );
});

// Create a new meat center with manager
export const createMeatCenter = asyncHandler(async (req, res) => {
    const {
        storeName,
        location,
        managerPhone,
        managerFirstName,
        managerLastName,
        managerEmail,
        latitude,
        longitude,
        pincode,
        products
    } = req.body;

    // Check if manager with this phone already exists
    const existingManager = await Manager.findOne({ phone: managerPhone });
    if (existingManager) {
        throw new ApiError(409, "Manager with this phone number already exists");
    }

    // Check if store with this name already exists
    const existingStore = await Store.findOne({ name: storeName });
    if (existingStore) {
        throw new ApiError(409, "Store with this name already exists");
    }

    // Create store first
    const store = await Store.create({
        name: storeName,
        location: location,
        phone: managerPhone, // ensure phone is set to avoid unique null duplication
        lat: parseFloat(latitude),
        long: parseFloat(longitude),
        pincode: pincode,
        products: products,
        isActive: true
    });
    console.log("🚀 ~ store:", store)

    // Create manager linked to the store
    const manager = await Manager.create({
        firstName: managerFirstName,
        lastName: managerLastName,
        email: managerEmail,
        phone: managerPhone,
        location: location,
        storeName: storeName,
        storeLocation: location,
        lat: parseFloat(latitude),
        long: parseFloat(longitude),
        pincode: pincode,
        store: store._id
    });
    console.log("🚀 ~ manager:", manager)

    // Update store with manager reference
    store.manager = manager._id;
    await store.save();

    // Populate manager details for response
    const populatedStore = await Store.findById(store._id)
        .populate('manager', 'firstName lastName phone email')
        .select('-__v');

    return res.status(201).json(
        new ApiResponse(201, populatedStore, "Meat center created successfully with manager")
    );
});

// Update a meat center
export const updateMeatCenter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const store = await Store.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName phone email')
        .select('-__v');

    if (!store) {
        throw new ApiError(404, "Meat center not found");
    }

    return res.status(200).json(
        new ApiResponse(200, store, "Meat center updated successfully")
    );
});

// Delete a meat center (soft delete)
export const deleteMeatCenter = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const store = await Store.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
    );

    if (!store) {
        throw new ApiError(404, "Meat center not found");
    }

    // Also deactivate the manager
    if (store.manager) {
        await Manager.findByIdAndUpdate(
            store.manager,
            { isActive: false },
            { new: true }
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Meat center deleted successfully")
    );
});

export const displayAllStoreName = asyncHandler(async (req, res) => {
    try {
        // Fetch only _id and name
        const stores = await Store.find({}, { _id: 1, name: 1 });

        return res.status(200).json(
            new ApiResponse(200, stores, "All store names fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching stores:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Failed to fetch stores")
        );
    }
});

export const MeatCenterController = {
    getMeatCenters,
    createMeatCenter,
    updateMeatCenter,
    deleteMeatCenter,
    displayAllStoreName
};
