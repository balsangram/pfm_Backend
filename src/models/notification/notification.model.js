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
        // required: true
    },
    img: {
        type: String
    }
})

export default mongoose.model("notification", notificationSchema);