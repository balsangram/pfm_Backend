import mongoose from "mongoose";

const categoriesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    }
},
    {
        timestamps: true
    })

export default mongoose.model("Categories", categoriesSchema);