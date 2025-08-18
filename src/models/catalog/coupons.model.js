import mongoose from "mongoose"

const couponsSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true
    },
    limit: {
        type: Number,
        required: true
    }
}, { timestamps: true })

export default mongoose.model("Coupons", couponsSchema)