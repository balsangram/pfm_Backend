import mongoose from "mongoose";

const notifySchema = new mongoose.Schema(
    {
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategory",
            required: true,
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Customer",
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Notify", notifySchema);
