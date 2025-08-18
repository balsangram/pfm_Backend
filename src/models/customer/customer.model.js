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

export default mongoose.model("Customer", customerSchema);