import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Categories from "../../models/catalog/categories.model.js";
import TypeCategory from "../../models/catalog/typeCategories.model.js";
import SubCategory from "../../models/catalog/subCategorySchema.model.js";

// Get all categories with type categories and sub categories for inventory management
const getInventoryCategories = asyncHandler(async (req, res) => {
    const categories = await Categories.find()
        .populate({
            path: 'typeCategories',
            populate: {
                path: 'subCategories',
                select: 'name img quantity price discount discountPrice type weight pieces serves totalEnergy'
            }
        })
        .select('name img typeCategories');

    res.status(200).json(
        new ApiResponse(200, categories, "Inventory categories retrieved successfully")
    );
});

// Get inventory by category ID
const getInventoryByCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid category ID");
    }

    const category = await Categories.findById(id)
        .populate({
            path: 'typeCategories',
            populate: {
                path: 'subCategories',
                select: 'name img quantity price discount discountPrice type weight pieces serves totalEnergy'
            }
        })
        .select('name img typeCategories');

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    res.status(200).json(
        new ApiResponse(200, category, "Category inventory retrieved successfully")
    );
});

// Get inventory by type category ID
const getInventoryByTypeCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid type category ID");
    }

    const typeCategory = await TypeCategory.findById(id)
        .populate('subCategories', 'name img quantity price discount discountPrice type weight pieces serves totalEnergy')
        .select('name img subCategories');

    if (!typeCategory) {
        throw new ApiError(404, "Type category not found");
    }

    res.status(200).json(
        new ApiResponse(200, typeCategory, "Type category inventory retrieved successfully")
    );
});

// Update product quantity (only managers can do this)
const updateProductQuantity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid product ID");
    }

    if (typeof quantity !== 'number' || quantity < 0) {
        throw new ApiError(400, "Quantity must be a non-negative number");
    }

    const product = await SubCategory.findByIdAndUpdate(
        id,
        { quantity },
        { new: true, runValidators: true }
    ).select('name img quantity price discount discountPrice type weight pieces serves totalEnergy');

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    res.status(200).json(
        new ApiResponse(200, product, "Product quantity updated successfully")
    );
});

// Get low stock products (quantity < 10)
const getLowStockProducts = asyncHandler(async (req, res) => {
    const lowStockProducts = await SubCategory.find({ quantity: { $lt: 10 } })
        .select('name img quantity price discount discountPrice type weight pieces serves totalEnergy')
        .sort({ quantity: 1 });

    res.status(200).json(
        new ApiResponse(200, lowStockProducts, "Low stock products retrieved successfully")
    );
});

// Get out of stock products (quantity = 0)
const getOutOfStockProducts = asyncHandler(async (req, res) => {
    const outOfStockProducts = await SubCategory.find({ quantity: 0 })
        .select('name img quantity price discount discountPrice type weight pieces serves totalEnergy')
        .sort({ name: 1 });

    res.status(200).json(
        new ApiResponse(200, outOfStockProducts, "Out of stock products retrieved successfully")
    );
});

// Bulk update quantities
const bulkUpdateQuantities = asyncHandler(async (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        throw new ApiError(400, "Updates array is required and must not be empty");
    }

    const bulkOps = updates.map(update => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(update.productId) },
            update: { $set: { quantity: update.quantity } }
        }
    }));

    const result = await SubCategory.bulkWrite(bulkOps);

    if (result.matchedCount !== updates.length) {
        throw new ApiError(400, "Some products were not found");
    }

    res.status(200).json(
        new ApiResponse(200, { updatedCount: result.modifiedCount }, "Bulk quantity update completed successfully")
    );
});

export {
    getInventoryCategories,
    getInventoryByCategory,
    getInventoryByTypeCategory,
    updateProductQuantity,
    getLowStockProducts,
    getOutOfStockProducts,
    bulkUpdateQuantities
};
