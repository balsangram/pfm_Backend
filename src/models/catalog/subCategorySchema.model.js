import mongoose from "mongoose";

const quantitySchema = new mongoose.Schema(
    {
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",  // reference to Manager collection
            required: true,
        },
        count: {
            type: Number,
            default: 0,
            min: [0, "Count cannot be negative"],
        }
    },
    { _id: false } // don't create separate _id for each subdocument
);

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
            // minlength: [2, "Name must be at least 2 characters long"],
            // maxlength: [100, "Name cannot exceed 100 characters"],
            index: true,
        },
        type: {
            type: [String],
            required: [true, "Type is required"],
            trim: true,
            index: true,
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
            // minlength: [5, "Description must be at least 5 characters long"],
        },
        unit: {
            type: String,
            required: true
        }
        ,
        weight: {
            type: String,
            // required: [true, "Weight is required"],
            trim: true,
            default: "0"
        },
        pieces: {
            type: String,
            // required: [true, "Pieces is required"],
            default: "0"
        },
        serves: {
            type: Number,
            required: [true, "Serves is required"],
            // min: [1, "Serves must be at least 1"],
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
            index: true,
        },
        discount: {
            type: Number, // percentage value like 10 for 10%
            default: 0,
            min: [0, "Discount cannot be negative"],
        },
        discountPrice: {
            type: Number,
            default: 0,
        },
        bestSellers: {
            type: Boolean,
            default: false,
        },
        quantity: {
            type: [quantitySchema], // ✅ array of managerId + count
            default: []
        },
    },
    { timestamps: true }
);

// Optional compound index if you frequently search/filter by type + price
SubCategorySchema.index({ type: 1, price: 1 });

// ✅ Pre-save middleware to calculate discountPrice with 2 decimals
// 
// ✅ Pre-save middleware to calculate discountPrice with exact 2 decimals
SubCategorySchema.pre("save", function (next) {
    if (this.discount && this.price) {
        let discounted = this.price - (this.price * this.discount) / 100;
        this.discountPrice = Math.round((discounted + Number.EPSILON) * 100) / 100;
    } else {
        this.discountPrice = Math.round((this.price + Number.EPSILON) * 100) / 100;
    }
    next();
});



export default mongoose.model("SubCategory", SubCategorySchema);
