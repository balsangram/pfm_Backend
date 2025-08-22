import mongoose from "mongoose";

// Category schema
const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            // unique: true, // prevents duplicate categories
            index: true,  // creates an index to speed up searches
        },
        img: {
            type: String,
            trim: true,
            // optional: uncomment if image is required
            // required: [true, "Category image is required"],
        },
        typeCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TypeCategory", // reference to TypeCategory model
                index: true,         // index for faster population queries
            },
        ],
    },
    { timestamps: true }
);

// Compound index example (if you want to index name + typeCategories together)
CategorySchema.index({ name: 1, typeCategories: 1 });

export default mongoose.model("Category", CategorySchema);
