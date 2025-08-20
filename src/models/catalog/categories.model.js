import mongoose from "mongoose";

// Category schema
const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true, // prevents duplicate categories
        },
        img: {
            type: String,
            trim: true,
            // optional: you can uncomment if image is required
            // required: [true, "Category image is required"],
        },
        typeCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TypeCategory", // reference to TypeCategory model
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);
