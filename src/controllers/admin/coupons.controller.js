import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Coupons from "../../models/catalog/coupons.model.js";
import { nanoid } from 'nanoid/non-secure';
import { parse } from 'date-fns'; // <-- ADD THIS LINE


// Display all coupons
const displayCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupons.find().sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(200, coupons, "Coupons fetched successfully")
    );
});

// Add a new coupon
const addCoupons = asyncHandler(async (req, res) => {
    let { name, code, img, discount, expiryDate, limit  } = req.body;
    console.log("🚀 ~ req.body:", req.body)

    if (!name || !discount || !limit || !expiryDate) {
        throw new ApiError(400, "Name, discount, limit, and expiryDate are required");
    }

    // Generate unique code if not provided
    if (!code) {
        code = nanoid(10); // 10-character unique code
    }

    // Check for duplicate code
    const existing = await Coupons.findOne({ code });
    console.log("🚀 ~ existing:", existing)
    if (existing) {
        throw new ApiError(400, "Coupon code already exists");
    }

    // Parse custom expiryDate format DD-MM-YYYY:HH:mm
    const parsedDate = parse(expiryDate, 'dd-MM-yyyy:HH:mm', new Date());
    console.log("🚀 ~ parsedDate:", parsedDate)

    const newCoupon = new Coupons({ name, code, img, discount, expiryDate: parsedDate, limit });
    console.log("🚀 ~ newCoupon:", newCoupon)
    await newCoupon.save();

    return res.status(201).json(
        new ApiResponse(201, newCoupon, "Coupon added successfully")
    );
});

// Edit a coupon

const editCoupons = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!id) throw new ApiError(400, "Coupon ID is required");

    // Parse expiryDate if provided in "DD-MM-YYYY:HH:mm" format
    if (updateData.expiryDate) {
        updateData.expiryDate = parse(updateData.expiryDate, 'dd-MM-yyyy:HH:mm', new Date());
    }

    const updatedCoupon = await Coupons.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCoupon) throw new ApiError(404, "Coupon not found");

    return res.status(200).json(
        new ApiResponse(200, updatedCoupon, "Coupon updated successfully")
    );
});


// Delete a coupon
const deleteCoupons = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Coupon ID is required");

    const deletedCoupon = await Coupons.findByIdAndDelete(id);
    if (!deletedCoupon) throw new ApiError(404, "Coupon not found");

    return res.status(200).json(
        new ApiResponse(200, "Coupon deleted successfully")
    );
});

export const couponsController = {
    displayCoupons,
    addCoupons,
    editCoupons,
    deleteCoupons
};
