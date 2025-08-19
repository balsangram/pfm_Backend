import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['verified', 'pending'],
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    assignedOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    totalDeliveries: {
        type: Number,
        default: 0
    },
    totalAccepted: {
        type: Number,
        default: 0
    },
    totalRejected: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
deliveryPartnerSchema.index({ phone: 1 });
deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ isActive: 1 });

export default mongoose.model("DeliveryPartner", deliveryPartnerSchema);