import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    img: {
        type: String
    }
}, {
    timestamps: true // ✅ This will auto-create createdAt & updatedAt
});

export default mongoose.model("Notification", notificationSchema);
