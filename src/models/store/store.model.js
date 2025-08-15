import mongoose from "mongoose"

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    }

}, {
    timestamps: true
})

export default mongoose.model("Store", storeSchema)