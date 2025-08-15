import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    fastName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true
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