import mongoose from "mongoose";

// Sub-schema for address
const addressSchema = new mongoose.Schema({
    houseNo: {
        type: String,
        required: true,
        trim: true
    },
    street: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Home', 'Office', 'Other'],
        default: 'Home'
    },
    latitude: {
        type: Number,
        default: null // optional
    },
    longitude: {
        type: Number,
        default: null // optional
    }
}, {
    // _id: false // prevents creating _id for each address
});


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
        ref: "Coupons"
    }],
    address: {
        type: [addressSchema], // array of addresses
        default: [] // optional, empty array if none provided
    },
    orders: [
        {
            subCategory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SubCategory",
                required: true
            },
            count: {
                type: Number,
                default: 1,
                min: 1
            },
            orderedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    orderHistory: [
        {
            order: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order",
            },
            orderedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],


}, {
    timestamps: true
});

// Index for better query performance
customerSchema.index({ phone: 1 });
customerSchema.index({ isActive: 1 });

export default mongoose.model("Customer", customerSchema);
