import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Categories from "../../models/catalog/categories.model.js"
import TypeCategory from "../../models/catalog/typeCategories.model.js";
import SubCategory from "../../models/catalog/subCategorySchema.model.js";

const allCategories = asyncHandler(async (req, res) => {
    // Fetch only name and img
    const categories = await Categories.find().select("name img");
    res.status(200).json(
        new ApiResponse(200, categories, "Product categories retrieved successfully")
    );
});

const bestSellingProducts = asyncHandler(async (req, res) => {
    // Fetch all subcategories where bestSellers is true
    const bestSellers = await SubCategory.find({ bestSellers: true }).sort({ createdAt: -1 }); // newest first

    if (!bestSellers || bestSellers.length === 0) {
        return res.status(404).json({ message: "No best-selling products found" });
    }

    res.status(200).json(bestSellers);
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

const categoriesTypes = asyncHandler(async (req, res) => {
    // Find all categories and populate typeCategories
    const categories = await Categories.find()
        .select("name img") // Only select category name and img
        .populate({
            path: "typeCategories",
            select: "name img", // Only select name and img of typeCategories
        });

    res.status(200).json(
        new ApiResponse(200, categories, "Categories with types retrieved successfully")
    );
});

const typeCategoriesAllCard = asyncHandler(async (req, res) => {
    const { id } = req.params; // TypeCategory ID

    // Find the TypeCategory by ID and populate subCategories
    const typeCategory = await TypeCategory.findById(id)
        .select("name subCategories")
        .populate({
            path: "subCategories",
            select: "name img description weight pieces serves price",
        });

    if (!typeCategory) {
        return res.status(404).json(new ApiResponse(404, null, "Type category not found"));
    }

    res.status(200).json(
        new ApiResponse(200, typeCategory, "Type category with sub-products retrieved successfully")
    );
});

const fullDetailsOfSubCategorieCard = asyncHandler(async (req, res) => {
    const { id } = req.params; // SubCategory ID

    // Find subcategory by ID
    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
        return res.status(404).json(new ApiResponse(404, null, "Subcategory not found"));
    }

    // Return full details
    res.status(200).json(
        new ApiResponse(200, subCategory, "Subcategory details retrieved successfully")
    );
});

// Controller
const searchItem = asyncHandler(async (req, res) => {
    const { name } = req.query; // ?name=...

    if (!name) {
        throw new ApiError(400, "Item name is required");
    }

    const items = await SubCategory.find({ name: { $regex: name, $options: "i" } });

    return res.status(200).json(new ApiResponse(200, items, "Items fetched successfully"));
});


const allSubCategories_bottom_search = asyncHandler(async (req, res) => {
    try {
        // ✅ Only fetch name and img
        const subCategories = await SubCategory.find().select("name img");

        if (!subCategories || subCategories.length === 0) {
            throw new ApiError(404, "No subcategories found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, subCategories, "Subcategories fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch subcategories");
    }
});



export const customerCategoriesController = {
    allCategories,

    bestSellingProducts,

    allCategoriesSubProducts,
    categoriesTypes,
    typeCategoriesAllCard,
    fullDetailsOfSubCategorieCard,
    searchItem,
    allSubCategories_bottom_search
};