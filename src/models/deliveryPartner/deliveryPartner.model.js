import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema({
    name: {
        type: String
    },
    phone: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
})

export default mongoose.model("DeliveryPartner", deliveryPartnerSchema)