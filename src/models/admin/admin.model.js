import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        // required: true,
    },
    lastName: {
        type: String,
    },
    phone: {
        type: String,
        // required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        default: null
    }
},
    {
        timestamps: true
    })

export default mongoose.model("Admin", adminSchema);