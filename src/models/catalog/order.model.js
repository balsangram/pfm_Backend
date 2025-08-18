import { required } from "joi";
import mongoose from "mongoose";

// Subschema for order items
const orderItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    orderDetails: [
        orderItemSchema
    ]
}, {
    timestamps: true
})

export default mongoose.model("Order", orderSchema);