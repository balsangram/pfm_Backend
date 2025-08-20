import mongoose from "mongoose";

const SubCategorySchema = new mongoose.Schema(
    {
        img: {
            type: String,
            trim: true,
            // optional: uncomment if image is required
            // required: [true, "Type category image is required"],
        },
        name: {
            type: String,
            required: [true, "Subcategory name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        type: {
            type: String,
            required: [true, "Type is required"],
            trim: true,
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
            type: String, // e.g., "200g", "500ml"
            required: [true, "Weight is required"],
            trim: true,
        },
        pieces: {
            type: Number,
            required: [true, "Pieces is required"],
            min: [1, "Pieces must be at least 1"],
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
        },
    },
    { timestamps: true }
);

export const SubCategory = mongoose.model("SubCategory", SubCategorySchema);