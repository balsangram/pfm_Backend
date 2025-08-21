import mongoose from "mongoose";

const couponsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Coupon name is required"],
        trim: true
    },
    code: {
        type: String,
        required: [true, "Coupon code is required"],
        unique: true, // ensures no duplicate codes
        trim: true
    },
    img: {
        type: String,
        trim: true
    },
    discount: {
        type: Number,
        required: [true, "Discount is required"],
        min: [0, "Discount must be at least 0"]
    },
    expiryDate: {
        type: Date,
        required: [true, "Expiry date is required"]
    },
    limit: {
        type: Number,
        required: [true, "Limit is required"],
        min: [1, "Limit must be at least 1"]
    }
}, { timestamps: true });

export default mongoose.model("Coupons", couponsSchema);
