import mongoose from "mongoose";

const SubCategorySchema = new mongoose.Schema(
    {
        img: {
            type: String,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Subcategory name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"],
            index: true, // index for faster search by name
        },
        type: {
            type: String,
            required: [true, "Type is required"],
            trim: true,
            index: true, // index for filtering by type
        },
        quality: {
            type: String,
            trim: true,
            default: "",
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            minlength: [5, "Description must be at least 5 characters long"],
        },
        weight: {
            type: String,
            required: [true, "Weight is required"],
            trim: true,
        },
        pieces: {
            type: String,
            required: [true, "Pieces is required"],
        },
        serves: {
            type: Number,
            required: [true, "Serves is required"],
            min: [1, "Serves must be at least 1"],
        },
        totalEnergy: {
            type: Number,
            required: [true, "Total energy is required"],
            min: [0, "Total energy cannot be negative"],
        },
        carbohydrate: {
            type: Number,
            default: 0,
            min: [0, "Carbohydrate cannot be negative"],
        },
        fat: {
            type: Number,
            default: 0,
            min: [0, "Fat cannot be negative"],
        },
        protein: {
            type: Number,
            default: 0,
            min: [0, "Protein cannot be negative"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
            index: true, // index for price-based queries
        },
    },
    { timestamps: true }
);

// Optional compound index if you frequently search/filter by type + price
SubCategorySchema.index({ type: 1, price: 1 });

export const SubCategory = mongoose.model("SubCategory", SubCategorySchema);
