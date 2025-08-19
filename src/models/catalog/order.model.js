import mongoose from "mongoose";

// Subschema for order items
const orderItemSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true,
            trim: true
        },
        quantity: { 
            type: Number, 
            required: true, 
            min: 1 
        },
        price: { 
            type: Number, 
            required: true, 
            min: 0 
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    clientName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    location: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 200
    },
    orderDetails: [orderItemSchema],
    phone: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    pickedUpBy: {
        type: String,
        trim: true,
        maxlength: 100
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner'
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager',
        required: true
    },
    notes: {
        type: String,
        maxlength: 500,
        trim: true
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    isUrgent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ store: 1 });
orderSchema.index({ manager: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ clientName: 'text', location: 'text' });

export default mongoose.model("Order", orderSchema);