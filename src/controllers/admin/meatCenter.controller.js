import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Store from '../../models/store/store.model.js';
import Manager from '../../models/manager/manager.model.js';

// Get all meat centers
export const getMeatCenters = asyncHandler(async (req, res) => {
    const stores = await Store.find({ isActive: true })
        .populate('manager', 'firstName lastName phone pincode')
        .select('-__v');
    console.log("🚀 ~ stores:", stores)

    return res.status(200).json(
        new ApiResponse(200, stores, "Meat centers retrieved successfully")
    );
});

// Create a new meat center with manager
// export const createMeatCenter = asyncHandler(async (req, res) => {
//     const {
//         storeName,
//         location,
//         managerPhone,
//         storePhone, // Add separate store phone field
//         managerFirstName,
//         managerLastName,
//         // managerEmail,
//         latitude,
//         longitude,
//         pincode,
//         products
//     } = req.body;

//     // Check if manager with this phone already exists
//     const existingManager = await Manager.findOne({ phone: managerPhone });
//     if (existingManager) {
//         throw new ApiError(409, "Manager with this phone number already exists");
//     }

//     // Check if store with this phone already exists
//     const existingStore = await Store.findOne({ phone: storePhone });
//     if (existingStore) {
//         throw new ApiError(409, "Store with this phone number already exists");
//     }

//     // Check if store with this name already exists
//     // const existingStore = await Store.findOne({ name: storeName });
//     // if (existingStore) {
//     //     throw new ApiError(409, "Store with this name already exists");
//     // }

//     // Create store first
//     const store = await Store.create({
//         name: storeName,
//         location: location,
//         phone: storePhone, // Use the provided store phone directly
//         lat: parseFloat(latitude),
//         long: parseFloat(longitude),
//         pincode: pincode,
//         products: products,
//         isActive: true
//     });
//     console.log("🚀 ~ store:", store)

//     // Create manager linked to the store
//     const manager = await Manager.create({
//         firstName: managerFirstName,
//         lastName: managerLastName,
//         // email: managerEmail,
//         phone: managerPhone,
//         location: location,
//         storeName: storeName,
//         storeLocation: location,
//         lat: parseFloat(latitude),
//         long: parseFloat(longitude),
//         pincode: pincode,
//         store: store._id
//     });
//     console.log("🚀 ~ manager:", manager)

//     // Update store with manager reference
//     store.manager = manager._id;
//     await store.save();

//     // Populate manager details for response
//     const populatedStore = await Store.findById(store._id)
//         .populate('manager', 'firstName lastName phone ')
//         .select('-__v');

//     return res.status(201).json(
//         new ApiResponse(201, populatedStore, "Meat center created successfully with manager")
//     );
// });

export const createMeatCenter = asyncHandler(async (req, res) => {
    const {
        storeName,
        location,
        managerPhone,
        storePhone,
        managerFirstName,
        managerLastName,
        latitude,
        longitude,
        pincode,
        products
    } = req.body;

    // 🔍 Check if manager with this phone already exists
    const existingManager = await Manager.findOne({ phone: managerPhone });
    if (existingManager) {
        throw new ApiError(409, "Manager with this phone number already exists");
    }

    // 🔍 Check if store with this phone already exists
    const existingStore = await Store.findOne({ phone: storePhone });
    if (existingStore) {
        throw new ApiError(409, "Store with this phone number already exists");
    }

    // 🏬 Create store first
    const store = await Store.create({
        name: storeName,
        location,
        phone: storePhone,
        lat: parseFloat(latitude),
        long: parseFloat(longitude),
        pincode,
        products,
        isActive: true
    });

    // 👨‍💼 Create manager linked to the store
    const manager = await Manager.create({
        firstName: managerFirstName,
        lastName: managerLastName,
        phone: managerPhone,
        location,
        storeName,
        storeLocation: location,
        lat: parseFloat(latitude),
        long: parseFloat(longitude),
        pincode,
        store: store._id
    });

    // 🔄 Update store with manager reference
    store.manager = manager._id;
    await store.save();

    // 📦 Populate manager details for response
    const populatedStore = await Store.findById(store._id)
        .populate("manager", "firstName lastName phone")
        .select("-__v");

    return res.status(201).json(
        new ApiResponse(201, populatedStore, "Meat center created successfully with manager")
    );
});

// Update a meat center
// export const updateMeatCenter = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const updateData = req.body;
//     console.log("🚀 ~ req.body:", req.body)

//     const store = await Store.findByIdAndUpdate(
//         id,
//         { $set: updateData },
//         { new: true, runValidators: true }
//     ).populate('manager', 'firstName lastName phone email')
//         .select('-__v');

//     if (!store) {
//         throw new ApiError(404, "Meat center not found");
//     }

//     return res.status(200).json(
//         new ApiResponse(200, store, "Meat center updated successfully")
//     );
// });

const updateMeatCenter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("🚀 ~  req.params:",  req.params)
    const {
        storeName,
        location,
        managerPhone,
        storePhone, // Add separate store phone field
        managerFirstName,
        managerLastName,
        managerEmail,
        latitude,
        longitude,
        pincode,
        products
    } = req.body;
    console.log("🚀 ~ req.body:", req.body)

    // Find the store
    const store = await Store.findById(id).populate("manager");
    if (!store) {
        throw new ApiError(404, "Meat center not found");
    }

    // ✅ Check if another store with the same name exists
    // if (storeName && storeName !== store.name) {
    //     const existingStore = await Store.findOne({ name: storeName, _id: { $ne: id } });
    //     if (existingStore) {
    //         throw new ApiError(409, "Another store with this name already exists");
    //     }
    // }

    // ✅ Check if another manager with same phone exists
    if (managerPhone && store.manager?.phone !== managerPhone) {
        const existingManager = await Manager.findOne({ phone: managerPhone, _id: { $ne: store.manager?._id } });
        if (existingManager) {
            throw new ApiError(409, "Another manager with this phone number already exists");
        }
    }

    // ✅ Check if another store with same phone exists
    if (storePhone && store.phone !== storePhone) {
        const existingStore = await Store.findOne({ phone: storePhone, _id: { $ne: id } });
        if (existingStore) {
            throw new ApiError(409, "Another store with this phone number already exists");
        }
    }

    // ✅ Update store fields
    store.name = storeName || store.name;
    store.location = location || store.location;
    store.phone = storePhone || store.phone; // Use the provided store phone
    store.lat = latitude ? parseFloat(latitude) : store.lat;
    store.long = longitude ? parseFloat(longitude) : store.long;
    store.pincode = pincode || store.pincode;
    store.products = products || store.products;

    await store.save();

    // ✅ Update manager fields if manager exists
    if (store.manager) {
        const manager = await Manager.findById(store.manager._id);
        if (manager) {
            manager.firstName = managerFirstName || manager.firstName;
            manager.lastName = managerLastName || manager.lastName;
            manager.phone = managerPhone || manager.phone;
            manager.location = location || manager.location;
            manager.storeName = storeName || manager.storeName;
            manager.storeLocation = location || manager.storeLocation;
            manager.lat = latitude ? parseFloat(latitude) : manager.lat;
            manager.long = longitude ? parseFloat(longitude) : manager.long;
            manager.pincode = pincode || manager.pincode;

            await manager.save();
        }
    }

    // ✅ Populate for response
    const updatedStore = await Store.findById(store._id)
        .populate("manager", "firstName lastName phone ")
        .select("-__v");
    console.log("🚀 ~ updatedStore:", updatedStore)

    return res.status(200).json(
        new ApiResponse(200, updatedStore, "Meat center updated successfully with manager")
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

// Update existing stores to have 'S' prefix phone numbers
export const updateStorePhoneNumbers = asyncHandler(async (req, res) => {
    try {
        // Find all stores that don't have 'S' prefix
        const storesToUpdate = await Store.find({
            phone: { $exists: true, $ne: null },
            $not: { phone: /^S/ }
        });

        if (storesToUpdate.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, { updated: 0 }, "All stores already have correct phone format")
            );
        }

        // Update each store
        let updatedCount = 0;
        for (const store of storesToUpdate) {
            if (store.phone && !store.phone.startsWith('S')) {
                store.phone = `S${store.phone}`;
                await store.save();
                updatedCount++;
            }
        }

        return res.status(200).json(
            new ApiResponse(200, { updated: updatedCount, total: storesToUpdate.length },
                `Updated ${updatedCount} stores with 'S' prefix phone numbers`)
        );
    } catch (error) {
        console.error("Error updating store phone numbers:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Failed to update store phone numbers")
        );
    }
});

export const MeatCenterController = {
    getMeatCenters,
    createMeatCenter,
    updateMeatCenter,
    deleteMeatCenter,
    displayAllStoreName,
    updateStorePhoneNumbers
};
