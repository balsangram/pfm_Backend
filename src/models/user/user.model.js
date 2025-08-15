import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    phone: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

export default mongoose.model("User", userSchema);