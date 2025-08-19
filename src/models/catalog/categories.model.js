import mongoose from "mongoose";

const subCategoriesSchema = new mongoose.Schema({
    img: {
        type: String,
        // required: true
    },
    name: {
        type: String,
        required: true
    },
    typeof: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    totalEnergy: {
        type: Number,
        required: true
    },
carbohydrate:{

},
Fat:{

},
Protein:{

}
});

const categoriesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        // required: true
    },
    subCategories: {
        type: [subCategoriesSchema], // array of subcategories
        required: false,             // explicitly optional
        default: []                  // default empty array if not provided
    }
}, {
    timestamps: true
});

export default mongoose.model("Categories", categoriesSchema);
