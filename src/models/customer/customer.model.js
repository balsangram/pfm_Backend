import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    phone: {
        type: String,
        required: true
    },
    wallet: {
        type: Number,
        default: 0
    },
    refreshToken: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "notification"
    }],
    Coupons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categories"
    }]
}, {
    timestamps: true
})

// Index for better query performance
customerSchema.index({ phone: 1 });
customerSchema.index({ isActive: 1 });

export default mongoose.model("Customer", customerSchema);