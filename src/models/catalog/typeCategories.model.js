import mongoose from "mongoose";

// TypeCategory schema
const TypeCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Type category name is required"],
            trim: true,
            unique: true, // prevents duplicates
            index: true,  // creates an index for faster search
        },
        img: {
            type: String,
            trim: true,
            // optional: uncomment if image is required
            // required: [true, "Type category image is required"],
        },
        subCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SubCategory", // reference to SubCategory model
                index: true,         // index for faster population queries
            },
        ],
    },
    { timestamps: true }
);

// Optional: compound index if needed for searches
TypeCategorySchema.index({ name: 1, subCategories: 1 });

export default mongoose.model("TypeCategory", TypeCategorySchema);
