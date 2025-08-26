import Customer from "../../models/customer/customer.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose from "mongoose";
import Coupons from "../../models/catalog/coupons.model.js";

const displayWalletPoint = asyncHandler(async (req, res) => {
    const { userId } = req.params; // or req.params depending on your route
    console.log("🚀 ~ userId:", userId)

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const customer = await Customer.findById(userId);
    if (!customer) throw new ApiError(404, "Customer not found");

    return res.status(200).json(
        new ApiResponse(200, { walletPoints: customer.wallet || 0 }, "Wallet points fetched successfully")
    );
});

const displayCoupons = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Find customer
    const customer = await Customer.findById(userId).populate("Coupons");
    console.log("🚀 ~ customer:", customer)
    if (!customer) throw new ApiError(404, "Customer not found");

    const allCoupons = await Coupons.find()
    console.log("🚀 ~ allCoupons:", allCoupons)


    // Get all active (not expired) coupons
    const today = new Date();
    const allActiveCoupons = await Coupons.find({ expiryDate: { $gt: today } });

    // IDs of coupons already assigned to user
    const userCouponIds = customer.Coupons.map(c => c._id.toString());

    // Filter available coupons (not assigned to user)
    const availableCoupons = allActiveCoupons.filter(c => !userCouponIds.includes(c._id.toString()));

    return res.status(200).json(
        new ApiResponse(200, {
            userCoupons: customer.Coupons, // already assigned to user
            availableCoupons // can be assigned to user
        }, "All coupons fetched successfully")
    );
});

const addCouponToUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { couponId } = req.body;
    // Validate IDs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    if (!couponId || !mongoose.Types.ObjectId.isValid(couponId)) {
        throw new ApiError(400, "Invalid coupon ID");
    }

    const customer = await Customer.findById(userId);
    if (!customer) throw new ApiError(404, "Customer not found");

    const coupon = await Coupons.findById(couponId);
    if (!coupon) throw new ApiError(404, "Coupon not found");

    // Check if coupon already added
    if (customer.Coupons.includes(couponId)) {
        throw new ApiError(400, "Coupon already assigned to this user");
    }

    // Add coupon ID to user's Coupons array
    customer.Coupons.push(couponId);
    await customer.save();

    return res.status(200).json(
        new ApiResponse(200, customer.Coupons, "Coupon added to user successfully")
    );
});



export const customerCouponsController = {
    displayWalletPoint,
    displayCoupons,
    addCouponToUser
};
