import { asyncHandler } from "../../utils/asyncHandler.js";
import Customer from "../../models/customer/customer.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose from "mongoose";
import axios from "axios";
import contactUsModel from "../../models/contactUs.model.js";

const customerProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const objectId = new mongoose.Types.ObjectId(userId);
    userId = objectId;
    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Find customer and select specific fields
    const customer = await Customer.findById(userId).select('name phone email');

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            name: customer.name || "Not provided",
            phone: customer.phone,
            email: customer.email || "Not provided"
        }, "Customer profile retrieved successfully")
    );
});

const updateProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { name, email } = req.body;
    const objectId = new mongoose.Types.ObjectId(userId);
    userId = objectId
    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Validate input
    if (!name && !email) {
        throw new ApiError(400, "At least one field (name or email) must be provided for update");
    }

    // Prepare update object
    const updateData = {};
    if (name) {
        updateData.name = name.trim();
        if (updateData.name.length < 2 || updateData.name.length > 100) {
            throw new ApiError(400, "Name must be between 2 and 100 characters");
        }
    }
    if (email) {
        updateData.email = email.trim().toLowerCase();
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
            throw new ApiError(400, "Invalid email format");
        }
    }

    // Update customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('name phone email');

    if (!updatedCustomer) {
        throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            name: updatedCustomer.name || "Not provided",
            phone: updatedCustomer.phone,
            email: updatedCustomer.email || "Not provided"
        }, "Profile updated successfully")
    );
});

const deleteCustomer = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const objectId = new mongoose.Types.ObjectId(userId);
    userId = objectId;
    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Find and delete customer
    const customer = await Customer.findByIdAndDelete(userId);

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Customer account deleted successfully")
    );
});

const customerLogout = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const objectId = new mongoose.Types.ObjectId(userId);
    userId = objectId;
    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Clear refresh token
    await Customer.findByIdAndUpdate(
        userId,
        { $set: { refreshToken: null } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Customer logged out successfully")
    );
});

// address ========================== 

const displayAddress = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const objectId = new mongoose.Types.ObjectId(userId);
    userId = objectId;
    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Find customer and select address field
    const customer = await Customer.findById(userId).select('address');

    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(
        new ApiResponse(200, customer.address || [], "Customer addresses retrieved successfully")
    );
});

const addAddress = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const objectId = new mongoose.Types.ObjectId(userId);
    userId = objectId;
    let { houseNo, street, city, state, pincode, type, latitude, longitude } = req.body;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Validate required fields
    if (!houseNo || !street || !city || !state || !pincode) {
        throw new ApiError(400, "All required address fields (houseNo, street, city, state, pincode) must be provided");
    }

    // Validate type if provided
    if (type && !['Home', 'Office', 'Other'].includes(type)) {
        throw new ApiError(400, "Invalid address type. Must be 'Home', 'Office', or 'Other'");
    }

    // Combine address for geocoding
    const fullAddress = `${houseNo}, ${street}, ${city}, ${state}, ${pincode}`;
    console.log("🚀 ~ fullAddress:", fullAddress)

    // Only fetch lat/long if not provided
    if (latitude === undefined || longitude === undefined) {
        try {
            // Use only the city for geocoding
            const response = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: {
                    q: pincode,       // city only
                    format: "json",
                    limit: 1       // get the first result
                },
                headers: {
                    'User-Agent': 'PFM-App/1.0' // Nominatim requires a user-agent
                }
            });

            if (!response.data || response.data.length === 0) {
                // fallback or default if city not found
                latitude = null;
                longitude = null;
                console.warn(`Could not determine lat/long for city: ${city}`);
            } else {
                latitude = parseFloat(response.data[0].lat);
                longitude = parseFloat(response.data[0].lon);
            }

        } catch (err) {
            throw new ApiError(500, "Geocoding failed: " + err.message);
        }
    }

    // Prepare new address
    const newAddress = {
        houseNo: houseNo.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        type: type || 'Home',
        latitude,
        longitude
    };
    console.log(Customer, "Customer");

    // Find customer and add address
    const customer = await Customer.findById(userId);
    console.log("🚀 ~ customer:", customer)
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    customer.address.push(newAddress);
    await customer.save();

    return res.status(201).json(
        new ApiResponse(201, "Address added successfully")
    );
});

const editAddress = asyncHandler(async (req, res) => {
    const { userId, addressId } = req.params;
    const objectId1 = new mongoose.Types.ObjectId(userId);
    const objectId2 = new mongoose.Types.ObjectId(addressId);
    userId = objectId1;
    addressId = objectId2;
    const { houseNo, street, city, state, pincode, type, latitude, longitude } = req.body;

    // Validate userId and addressId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    if (!addressId) {
        throw new ApiError(400, "Address ID is required");
    }

    // Validate at least one field is provided
    if (!houseNo && !street && !city && !state && !pincode && !type && latitude === undefined && longitude === undefined) {
        throw new ApiError(400, "At least one field must be provided for update");
    }

    // Find customer
    const customer = await Customer.findById(userId);
    if (!customer) throw new ApiError(404, "Customer not found");
    console.log(addressId, "addressId");

    // Find address
    const address = customer.address.id(addressId);
    console.log("🚀 ~ address:", address)
    if (!address) throw new ApiError(404, "Address not found");

    // Update fields if provided
    if (houseNo) address.houseNo = houseNo.trim();
    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (pincode) address.pincode = pincode.trim();
    if (type) {
        if (!['Home', 'Office', 'Other'].includes(type)) {
            throw new ApiError(400, "Invalid address type. Must be 'Home', 'Office', or 'Other'");
        }
        address.type = type;
    }

    // Auto-generate latitude & longitude if not manually provided
    if (latitude === undefined || longitude === undefined) {
        const fullAddress = `${address.houseNo}, ${address.street}, ${address.city}, ${address.state}, ${address.pincode}`;
        try {
            const response = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: { q: address.pincode, format: "json", limit: 1 },
                headers: { 'User-Agent': 'PFM-App/1.0' } // required by Nominatim
            });

            if (response.data && response.data.length > 0) {
                address.latitude = parseFloat(response.data[0].lat);
                address.longitude = parseFloat(response.data[0].lon);
            } else {
                // fallback to null if not found
                address.latitude = null;
                address.longitude = null;
            }
        } catch (err) {
            console.warn("Geocoding failed:", err.message);
            address.latitude = null;
            address.longitude = null;
        }
    } else {
        // If lat/lon provided manually
        address.latitude = latitude;
        address.longitude = longitude;
    }

    // Save customer
    await customer.save();

    return res.status(200).json(
        new ApiResponse(200, address, "Address updated successfully with updated location")
    );
});

const deleteAddress = asyncHandler(async (req, res) => {
    const { userId, addressId } = req.params;
    const objectId1 = new mongoose.Types.ObjectId(userId);
    const objectId2 = new mongoose.Types.ObjectId(addressId);
    userId = objectId1;
    addressId = objectId2;

    // Validate userId and addressId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    if (!addressId) {
        throw new ApiError(400, "Address ID is required");
    }

    // Find customer and remove address
    const customer = await Customer.findById(userId);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    const addressIndex = customer.address.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
        throw new ApiError(404, "Address not found");
    }

    customer.address.splice(addressIndex, 1);
    await customer.save();

    return res.status(200).json(
        new ApiResponse(200, "Address deleted successfully")
    );
});

const getContacts = asyncHandler(async (req, res) => {
    const { type } = "Customer"; // example: /contacts?type=Customer

    let filter = {};
    if (type) {
        filter.type = type;
    }

    // Fetch only `phone` field using projection
    const contacts = await contactUsModel.find(filter, { phone: 1, _id: 0 }).sort({ createdAt: -1 });

    // Extract only phone numbers into an array
    const phoneNumbers = contacts.map(contact => contact.phone);

    return res.status(200).json(
        new ApiResponse(200, phoneNumbers, "Contacts fetched successfully")
    );
});


export const customerProfileController = {
    customerProfile,
    updateProfile,
    deleteCustomer,
    customerLogout,
    // address 
    displayAddress,
    addAddress,
    editAddress,
    deleteAddress,

    getContacts
};