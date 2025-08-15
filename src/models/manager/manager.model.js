import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: String,
    },
    storeName: {
        type: String,
        required: true,
        unique: true
    },
    storeLocation: {
        type: String,
        required: true
    }

}, {
    timestamps: true
})
export default mongoose.model("Manager", managerSchema);