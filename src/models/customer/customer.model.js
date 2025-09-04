
// import { boolean } from "joi";
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
    },
    isSelected: {
        type: Boolean,
        default: false
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
        ref: "Notification" // Fixed duplicate and corrected reference
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
    fcToken: {
        type: [String],
        // required: true 
        default: [],
    }
}, {
    timestamps: true
});

// Middleware to ensure only one address has isSelected: true
// customerSchema.pre('save', function (next) {
//     if (this.address && this.address.length > 0) {
//         const selectedAddress = this.address.find(addr => addr.isSelected === true);
//         if (selectedAddress) {
//             // Set all addresses to isSelected: false except the selected one
//             this.address.forEach(addr => {
//                 addr.isSelected = addr._id.equals(selectedAddress._id);
//             });
//         } else {
//             // If no address is selected, set the first address as selected (optional logic)
//             this.address[0].isSelected = true;
//             this.address.forEach((addr, index) => {
//                 if (index !== 0) addr.isSelected = false;
//             });
//         }
//     }
//     next();
// });

// Index for better query performance
customerSchema.index({ phone: 1 });
customerSchema.index({ isActive: 1 });

export default mongoose.model("Customer", customerSchema);