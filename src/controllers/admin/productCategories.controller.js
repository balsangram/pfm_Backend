import mongoose from "mongoose";
import Categories from "../../models/catalog/categories.model.js"
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


// categories 

const getProductCategories = asyncHandler(async (req, res) => {
    // Fetch only name and img
    const categories = await Categories.find().select("name img");
    res.status(200).json(
        new ApiResponse(200, categories, "Product categories retrieved successfully")
    );
});

const createProductCategory = asyncHandler(async (req, res) => {
    const { name, img } = req.body;

    // Check if category already exists
    const existingCategory = await Categories.findOne({ name });
    if (existingCategory) {
        throw new ApiError(400, "Category with this name already exists");
    }

    // Create new category
    const category = await Categories.create({ name, img });

    // Pick only name and img
    const responseData = {
        name: category.name,
        img: category.img
    };

    // Send structured response
    res.status(201).json(new ApiResponse(201, responseData, "Category created successfully"));
});

const updateProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, img } = req.body;

    // Check if category exists
    const existingCategory = await Categories.findById(id);
    if (!existingCategory) {
        throw new ApiError(404, "Category not found");
    }

    // Update category
    existingCategory.name = name;
    existingCategory.img = img;
    await existingCategory.save();

    // Pick only name and img
    const responseData = {
        name: existingCategory.name,
        img: existingCategory.img
    };

    // Send structured response
    res.status(200).json(new ApiResponse(200, responseData, "Category updated successfully"));
});

export const deleteProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid category ID");
    }

    // Find the category
    const category = await Categories.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Check if subCategories array is empty
    if (category.subCategories.length > 0) {
        throw new ApiError(
            400,
            "Cannot delete category with existing subcategories. Please delete subcategories first."
        );
    }

    // Remove the category
    await Categories.deleteOne({ _id: id });
    // Send response
    res.status(200).json(new ApiResponse(200, null, "Category deleted successfully"));
});

// sub categories

const getSubProductCategories = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Fetch parent category with subcategories
    const category = await Categories.findById(id).select("name subCategories");

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Prepare response
    const responseData = {
        id: category._id,
        categoryName: category.name,
        subCategories: category.subCategories.map(sub => ({
            id: sub._id,
            name: sub.name,
            img: sub.img
        }))
    };

    res.status(200).json(
        new ApiResponse(200, responseData, "Subcategories retrieved successfully")
    );
});

const createSubProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params; // parent category id
    const { name, img } = req.body;

    // Check if parent category exists
    const parentCategory = await Categories.findById(id);
    if (!parentCategory) {
        throw new ApiError(404, "Parent category not found");
    }

    // Add new subcategory to the array
    const newSubcategory = { name, img };
    parentCategory.subCategories.push(newSubcategory);

    // Save parent category
    await parentCategory.save();

    // Return only name and img of the newly added subcategory
    const responseData = {
        id: newSubcategory._id,
        name: name,
        img: img
    };

    res.status(201).json(new ApiResponse(201, responseData, "Subcategory added successfully"));
});

const updateSubProductCategory = asyncHandler(async (req, res) => {
    console.log("🚀 ~ req.params:", req.params)
    console.log("🚀 ~ req.body:", req.body)
    const { id } = req.params; // parent category id
    const { subId, name, img } = req.body;

    // Check if parent category exists
    const parentCategory = await Categories.findById(id);
    console.log("🚀 ~ parentCategory:", parentCategory)
    if (!parentCategory) {
        throw new ApiError(404, "Parent category not found");
    }

    // Find subcategory to update
    const subcategory = parentCategory.subCategories.id(subId);
    console.log("🚀 ~ subcategory:", subcategory)
    if (!subcategory) {
        throw new ApiError(404, "Subcategory not found");
    }

    // Update subcategory
    subcategory.name = name;
    subcategory.img = img;
    await parentCategory.save();

    // Return updated subcategory
    res.status(200).json(new ApiResponse(200, subcategory, "Subcategory updated successfully"));
});

export const deleteSubProductCategory = asyncHandler(async (req, res) => {
    console.log("🚀 ~ id, subId:", req.params)
    const { id, subId } = req.params;

    // Trim IDs to avoid issues
    const trimmedParentId = id.trim();
    const trimmedSubId = subId.trim();

    // Validate parent ID
    if (!mongoose.Types.ObjectId.isValid(trimmedParentId)) {
        throw new ApiError(400, "Invalid parent category ID");
    }

    // Validate subcategory ID
    if (!mongoose.Types.ObjectId.isValid(trimmedSubId)) {
        throw new ApiError(400, "Invalid subcategory ID");
    }

    const parentCategory = await Categories.findById(trimmedParentId);
    console.log("🚀 ~ parentCategory:", parentCategory)
    if (!parentCategory) {
        throw new ApiError(404, "Parent category not found");
    }
    console.log(trimmedSubId, "trimmedSubId");

    // Find subcategory by ID
    const subcategory = parentCategory.subCategories.id(trimmedSubId);
    console.log("🚀 ~ subcategory:", subcategory)
    if (!subcategory) {
        console.log("Available subcategory IDs:", parentCategory.subCategories.map(sc => sc._id.toString()));
        throw new ApiError(404, "Subcategory not found");
    }

    // Remove subcategory
    parentCategory.subCategories = parentCategory.subCategories.filter(
        sc => sc._id.toString() !== trimmedSubId
    );

    await parentCategory.save();
    res.status(200).json(new ApiResponse(200, null, "Subcategory deleted successfully"));
});


export const ProductCategoryController = {
    // categories 
    getProductCategories,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,
    // subcategories
    getSubProductCategories,
    createSubProductCategory,
    updateSubProductCategory,
    deleteSubProductCategory,
};
