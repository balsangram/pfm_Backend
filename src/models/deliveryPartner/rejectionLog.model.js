import mongoose from "mongoose";

const rejectionLogSchema = new mongoose.Schema({
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    reason: {
        type: String,
        enum: ['customer_not_available', 'wrong_address', 'payment_issue', 'order_cancelled', 'other'],
        default: 'other'
    },
    notes: {
        type: String,
        maxlength: 500,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

rejectionLogSchema.index({ deliveryPartner: 1, createdAt: -1 });
rejectionLogSchema.index({ order: 1 });

export default mongoose.model('DeliveryRejectionLog', rejectionLogSchema);


