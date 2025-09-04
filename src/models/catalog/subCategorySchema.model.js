// import mongoose from "mongoose";

// // Quantity sub-schema
// const quantitySchema = new mongoose.Schema(
//     {
//         managerId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Manager",
//             required: true,
//         },
//         count: {
//             type: Number,
//             default: 0,
//             min: [0, "Count cannot be negative"],
//         },
//     },
//     { _id: false }
// );

// // SubCategory schema
// const SubCategorySchema = new mongoose.Schema(
//     {
//         img: {
//             type: String,
//             trim: true,
//         },
//         name: {
//             type: String,
//             required: [true, "Subcategory name is required"],
//             trim: true,
//             index: true,
//         },
//         type: {
//             type: [String], // ✅ array of strings
//             required: [true, "Type is required"],
//             index: true,
//         },
//         quality: {
//             type: String,
//             trim: true,
//             default: "",
//         },
//         description: {
//             type: String,
//             required: [true, "Description is required"],
//             trim: true,
//         },
//         unit: {
//             type: String,
//             required: true,
//         },
//         weight: {
//             type: String,
//             trim: true,
//             default: "0",
//         },
//         pieces: {
//             type: String,
//             default: "0",
//         },
//         serves: {
//             type: Number,
//             required: [true, "Serves is required"],
//         },
//         totalEnergy: {
//             type: Number,
//             required: [true, "Total energy is required"],
//             min: [0, "Total energy cannot be negative"],
//         },
//         carbohydrate: {
//             type: Number,
//             default: 0,
//             min: [0, "Carbohydrate cannot be negative"],
//         },
//         fat: {
//             type: Number,
//             default: 0,
//             min: [0, "Fat cannot be negative"],
//         },
//         protein: {
//             type: Number,
//             default: 0,
//             min: [0, "Protein cannot be negative"],
//         },
//         price: {
//             type: Number,
//             required: [true, "Price is required"],
//             min: [0, "Price cannot be negative"],
//             index: true,
//         },
//         discount: {
//             type: Number,
//             default: 0,
//             min: [0, "Discount cannot be negative"],
//         },
//         discountPrice: {
//             type: Number,
//             default: 0,
//         },
//         bestSellers: {
//             type: Boolean,
//             default: false,
//         },
//         quantity: {
//             type: [quantitySchema],
//             default: [],
//         },
//         available: {
//             type: Boolean,
//             default: false,
//         }
//     },
//     { timestamps: true }
// );

// // Compound index
// SubCategorySchema.index({ type: 1, price: 1 });

// // ✅ Pre-save middleware
// SubCategorySchema.pre("save", function (next) {
//     // Ensure type is always an array
//     if (typeof this.type === "string") {
//         try {
//             this.type = JSON.parse(this.type);
//         } catch (err) {
//             this.type = [this.type]; // fallback if it's just a single string
//         }
//     }

//     // Calculate discountPrice
//     if (this.discount && this.price) {
//         let discounted = this.price - (this.price * this.discount) / 100;
//         this.discountPrice =
//             Math.round((discounted + Number.EPSILON) * 100) / 100;
//     } else {
//         this.discountPrice =
//             Math.round((this.price + Number.EPSILON) * 100) / 100;
//     }

//     next();
// });

// export default mongoose.model("SubCategory", SubCategorySchema);


import mongoose from "mongoose";

// Quantity sub-schema
const quantitySchema = new mongoose.Schema(
    {
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manager",
            required: true,
        },
        count: {
            type: Number,
            default: 0,
            min: [0, "Count cannot be negative"],
        },
    },
    { _id: false }
);

// SubCategory schema
const SubCategorySchema = new mongoose.Schema(
    {
        img: { type: String, trim: true },
        name: {
            type: String,
            required: [true, "Subcategory name is required"],
            trim: true,
            index: true,
        },
        type: {
            type: [String], // ✅ array of strings
            required: [true, "Type is required"],
            index: true,
        },
        quality: { type: String, trim: true, default: "" },
        description: { type: String, required: true, trim: true },
        unit: { type: String, required: true },
        weight: { type: String, trim: true, default: "0" },
        pieces: { type: String, default: "0" },
        serves: { type: Number, required: true },
        totalEnergy: { type: Number, required: true, min: 0 },
        carbohydrate: { type: Number, default: 0, min: 0 },
        fat: { type: Number, default: 0, min: 0 },
        protein: { type: Number, default: 0, min: 0 },
        price: { type: Number, required: true, min: 0, index: true },
        discount: { type: Number, default: 0, min: 0 },
        discountPrice: { type: Number, default: 0 },
        bestSellers: { type: Boolean, default: false },
        quantity: { type: [quantitySchema], default: [] },
        available: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Compound index
SubCategorySchema.index({ type: 1, price: 1 });

// ✅ Pre-save middleware
SubCategorySchema.pre("save", function (next) {
    // Ensure type is always an array
    if (typeof this.type === "string") {
        try {
            this.type = JSON.parse(this.type);
        } catch {
            this.type = [this.type]; // fallback if it's just a single string
        }
    }

    // Calculate discountPrice
    if (this.discount && this.price) {
        const discounted = this.price - (this.price * this.discount) / 100;
        this.discountPrice = Math.round((discounted + Number.EPSILON) * 100) / 100;
    } else {
        this.discountPrice = Math.round((this.price + Number.EPSILON) * 100) / 100;
    }

    // ✅ Set availability based on quantity
    if (!this.quantity || this.quantity.length === 0) {
        console.log("false");

        this.available = false;
    } else {
        console.log("true");

        this.available = this.quantity.some(q => q.count > 0);
    }

    next();
});

export default mongoose.model("SubCategory", SubCategorySchema);
