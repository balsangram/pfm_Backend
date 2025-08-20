import mongoose from "mongoose";

// TypeCategory schema
const TypeCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Type category name is required"],
            trim: true,
            unique: true, // prevents duplicates
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
            },  
        ],
    },
    { timestamps: true }
);

export default mongoose.model("TypeCategory", TypeCategorySchema);
