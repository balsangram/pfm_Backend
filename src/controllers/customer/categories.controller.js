import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Categories from "../../models/catalog/categories.model.js"

const allCategories = asyncHandler(async (req, res) => {
    // Fetch only name and img
    const categories = await Categories.find().select("name img");
    res.status(200).json(
        new ApiResponse(200, categories, "Product categories retrieved successfully")
    );
});


const allCategoriesSubProducts = asyncHandler(async (req, res) => {
    console.log("hello");

    console.log("🚀 ~ req.params:", req.params)
    const { id } = req.params; // Category ID

    // Find the category and populate typeCategories -> subCategories
    const category = await Categories.findById(id)
        .populate({
            path: "typeCategories",
            populate: {
                path: "subCategories",
                select: "name img description weight pieces serves price", // select needed fields
            },
        });

    if (!category) {
        return res.status(404).json(new ApiResponse(404, null, "Category not found"));
    }

    // Collect all subcategories from all typeCategories
    const allSubCategories = [];
    category.typeCategories.forEach(tc => {
        allSubCategories.push(...tc.subCategories);
    });

    res.status(200).json(
        new ApiResponse(200, allSubCategories, "Sub-products retrieved successfully")
    );
});



export const customerCategoriesController = {
    allCategories,
    allCategoriesSubProducts
};