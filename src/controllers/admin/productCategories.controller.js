import mongoose from "mongoose";
import Categories from "../../models/catalog/categories.model.js"
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { SubCategory } from "../../models/catalog/subCategorySchema.model.js"
import TypeCategory from "../../models/catalog/typeCategories.model.js";

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
    console.log("🚀 ~  req.body:", req.body)

    // Check if category already exists
    const existingCategory = await Categories.findOne({ name });
    if (existingCategory) {
        throw new ApiError(400, "Category with this name already exists");
    }

    // Create new category
    const category = await Categories.create({ name, images: [img] });

    // Pick only name and images
    const responseData = {
        name: category.name,
        images: category.images,
    };

    // Send structured response
    res.status(201).json(new ApiResponse(201, responseData, "Category created successfully"));
});

const updateProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, img } = req.body;

    // Update and return only name, img
    const updatedCategory = await Categories.findByIdAndUpdate(
        id,
        { name, img },
        { new: true, runValidators: true, select: "name img" }
    );
    console.log("🚀 ~ updatedCategory:", updatedCategory)

    if (!updatedCategory) {
        throw new ApiError(404, "Category not found");
    }

    // Send structured response
    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedCategory,
                "Category updated successfully"
            )
        );
});

const deleteProductCategory = asyncHandler(async (req, res) => {
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

    // Check if typeCategories array is empty
    if (category.typeCategories.length > 0) {
        throw new ApiError(
            400,
            "Cannot delete category with existing type categories. Please delete type categories first."
        );
    }

    // Remove the category
    await Categories.deleteOne({ _id: id });

    // Send response
    res.status(200).json(new ApiResponse(200, null, "Category deleted successfully"));
});

// type categories

const getTypeCategories = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find category by ID and populate typeCategories with only name & img
    const category = await Categories.findById(id).populate({
        path: "typeCategories",
        select: "name img", // only fetch name & img
    });

    if (!category) {
        return res.status(404).json(
            new ApiResponse(404, null, "Category not found")
        );
    }

    res.status(200).json(
        new ApiResponse(200, category.typeCategories, "Type categories retrieved successfully")
    );
});

const createTypeCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid category ID");
    }

    // Find parent category
    const category = await Categories.findById(id).populate("typeCategories");
    if (!category) {
        throw new ApiError(404, "Parent category not found");
    }

    const { name, img } = req.body;

    // Check for duplicate type category name under this category
    const exists = category.typeCategories.some(
        (tc) => tc.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
        throw new ApiError(400, "Type category with this name already exists");
    }

    // Create TypeCategory document
    const typeCategory = await TypeCategory.create({
        name: name.trim(),
        img: img?.trim() || "",
        subCategories: [],
    });

    // Push TypeCategory _id into category
    category.typeCategories.push(typeCategory._id);
    await category.save();

    res.status(201).json(
        new ApiResponse(201, typeCategory, "Type category added successfully")
    );
});

const updateTypeCategory = asyncHandler(async (req, res) => {
    const { id } = req.params; // This is typeCategoryId
    const { name, img } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid type category ID");
    }

    // Find the parent category that includes this typeCategory
    const category = await Categories.findOne({ typeCategories: id });
    if (!category) {
        throw new ApiError(404, "Parent category not found");
    }

    // Update TypeCategory document directly
    const typeCategory = await TypeCategory.findByIdAndUpdate(
        id,
        {
            ...(name && { name: name.trim() }),
            ...(img && { img: img.trim() }),
        },
        { new: true } // return updated document
    );

    if (!typeCategory) {
        throw new ApiError(404, "Type category not found");
    }

    res.status(200).json(
        new ApiResponse(200, typeCategory, "Type category updated successfully")
    );
});

const deleteTypeCategory = asyncHandler(async (req, res) => {
    const { id, categoryId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid type category ID");
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new ApiError(400, "Invalid category ID");
    }

    // Check if TypeCategory exists
    const typeCategory = await TypeCategory.findById(id);
    if (!typeCategory) {
        throw new ApiError(404, "Type category not found");
    }

    // Prevent deletion if subCategories are not empty
    if (typeCategory.subCategories.length > 0) {
        throw new ApiError(
            400,
            "Cannot delete type category with existing subcategories. Please delete subcategories first."
        );
    }

    // Find parent category and ensure it contains this type category
    const parentCategory = await Categories.findById(categoryId);
    if (!parentCategory) {
        throw new ApiError(404, "Parent category not found");
    }
    if (!parentCategory.typeCategories.includes(id)) {
        throw new ApiError(
            400,
            "This type category does not belong to the specified parent category."
        );
    }

    // Delete the TypeCategory document
    await TypeCategory.findByIdAndDelete(id);

    // Remove reference from parent category
    parentCategory.typeCategories.pull(id);
    await parentCategory.save();

    res.status(200).json(
        new ApiResponse(200, null, "Type category deleted successfully")
    );
});

// sub categories

const getSubProductCategories = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("🚀 ~ req.params:", req.params)

    // Validate parent ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid category ID");
    }

    // Fetch parent category with subcategories populated
    const category = await TypeCategory.findById(id)
        .select("name subCategories") // include category name
        .populate("subCategories", "name img"); // only name + img from subcategory
    console.log("🚀 ~ category:", category)

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Format response
    const responseData = {
        id: category._id,
        categoryName: category.name,
        subCategories: category.subCategories.map((sub) => ({
            id: sub._id,
            name: sub.name,
            img: sub.images?.length > 0 ? sub.images[0] : null,
        })),
    };

    res.status(200).json(
        new ApiResponse(200, responseData, "Subcategories retrieved successfully")
    );
});

const createSubProductCategory = asyncHandler(async (req, res) => {
    console.log(req.body, "body");

    const { id } = req.params; // parent category ID
    const {
        name,
        images,
        type,
        quality,
        weight,
        pieces,
        serves,
        totalEnergy,
        carbohydrate,
        fat,
        protein,
        description,
        price
    } = req.body;

    // Check parent category exists
    const parentCategory = await TypeCategory.findById(id);
    console.log("🚀 ~ parentCategory:", parentCategory)
    if (!parentCategory) {
        throw new ApiError(404, "Parent TypeCategory not found");
    }

    // Create subcategory document
    const newSubcategory = await SubCategory.create({
        name,
        images: images || [],
        type,
        quality: quality || "",
        weight,
        pieces,
        serves: Number(serves),
        totalEnergy: Number(totalEnergy),
        carbohydrate: carbohydrate ? Number(carbohydrate) : 0,
        fat: fat ? Number(fat) : 0,
        protein: protein ? Number(protein) : 0,
        description,
        price: Number(price)
    });
    console.log("🚀 ~ newSubcategory:", newSubcategory)

    // Push subcategory _id to parent category
    parentCategory.subCategories.push(newSubcategory._id);
    console.log("🚀 ~ parentCategory:", parentCategory)
    await parentCategory.save();

    // Return structured response
    res.status(201).json(
        new ApiResponse(201, {
            id: newSubcategory._id,
            name: newSubcategory.name,
            images: newSubcategory.images,
        }, "Subcategory added successfully")
    );
});

const updateSubProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params; // direct subcategory id
    console.log("🚀 ~ subId:", id)

    const {
        name,
        images,
        type,
        quality,
        weight,
        pieces,
        serves,
        totalEnergy,
        carbohydrate,
        fat,
        protein,
        description,
        price
    } = req.body;

    // Update subcategory directly
    // Update and return only name, img
    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
        id,
        {
            name,
            images,
            type,
            quality,
            weight,
            pieces,
            serves,
            totalEnergy,
            carbohydrate,
            fat,
            protein,
            description,
            price
        },
        { new: true, runValidators: true, select: "name images type quality weight pieces serves totalEnergy carbohydrate fat protein description price" }
    );
    console.log("🚀 ~ updatedSubCategory:", updatedSubCategory)

    if (!updatedSubCategory) {
        throw new ApiError(404, "Subcategory not found");
    }


    res.status(200).json(
        new ApiResponse(200, updatedSubCategory, "Subcategory updated successfully")
    );
});

const deleteSubProductCategory = asyncHandler(async (req, res) => {
    const { id, categoryId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid subcategory ID");
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new ApiError(400, "Invalid parent category ID");
    }

    // Check if SubCategory exists
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
        throw new ApiError(404, "Subcategory not found");
    }

    // Delete the SubCategory document
    await SubCategory.findByIdAndDelete(id);

    // Remove reference from parent category
    const parentCategory = await TypeCategory.findById(categoryId); // or Categories if direct parent
    if (parentCategory) {
        parentCategory.subCategories.pull(id);
        await parentCategory.save();
    }

    res.status(200).json(
        new ApiResponse(200, null, "Subcategory deleted successfully")
    );
});


const getAllDetailsOfSubCategoriesProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("🚀 ~ req.params:", req.params)

    // Find the subcategory
    const subCategory = await SubCategory.findById(id);
    console.log("🚀 ~ subCategory:", subCategory)
    if (!subCategory) {
        throw new ApiError(404, "Subcategory not found");
    }

    res.status(200).json(new ApiResponse(200, subCategory, "Subcategory details fetched successfully"));
});

export const ProductCategoryController = {
    // categories 
    getProductCategories,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,
    // type categories
    getTypeCategories,
    createTypeCategory,
    updateTypeCategory,
    deleteTypeCategory,
    // subcategories
    getSubProductCategories,
    createSubProductCategory,
    updateSubProductCategory,
    deleteSubProductCategory,
    getAllDetailsOfSubCategoriesProduct,
};
