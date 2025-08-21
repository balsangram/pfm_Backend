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
    { _id: true } // keep _id to reference individual items
);

// Main Order Schema
const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
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
    geoLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner'
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
    isUrgent: {
        type: Boolean,
        default: false
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
    },
    // Delivery tracking fields
    deliveryStatus: {
        type: String,
        enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'rejected'],
        default: 'pending'
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    deliveryRejectionReason: {
        type: String,
        enum: ['customer_not_available', 'wrong_address', 'payment_issue', 'order_cancelled', 'other'],
        default: null
    },
    deliveryRejectionNotes: {
        type: String,
        maxlength: 500,
        trim: true
    },
    pickedUpAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
orderSchema.index({ status: 1 });
orderSchema.index({ store: 1 });
orderSchema.index({ manager: 1 });
orderSchema.index({ geoLocation: "2dsphere" }); // geospatial index
orderSchema.index({ createdAt: -1 });
orderSchema.index({ clientName: 'text', location: 'text' }); // text index

export default mongoose.model("Order", orderSchema);
