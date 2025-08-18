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
    // storeName: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },
    // storeLocation: {
    //     type: String,
    //     required: true
    // }
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    }
}, {
    timestamps: true
})
export default mongoose.model("Manager", managerSchema);