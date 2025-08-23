import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        // required: true,
    },
    img: {
        type: String,
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
    }
},
    {
        timestamps: true
    })

export default mongoose.model("Admin", adminSchema);