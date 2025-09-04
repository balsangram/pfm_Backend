import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Categories from "../../models/catalog/categories.model.js"
import TypeCategory from "../../models/catalog/typeCategories.model.js";
import SubCategory from "../../models/catalog/subCategorySchema.model.js";
import mongoose from "mongoose";
import Customers from "../../models/customer/customer.model.js"

// const allCategories = asyncHandler(async (req, res) => {
//     // Fetch only name and img
//     const categories = await Categories.find().select("name img");
//     res.status(200).json(
//         new ApiResponse(200, categories, "Product categories retrieved successfully")
//     );
// });

const allCategories = asyncHandler(async (req, res) => {
    // ✅ Get the number from query params
    const { limit } = req.query;

    // ✅ Fetch only name and img
    let query = Categories.find().select("name img");

    // ✅ If limit is provided, apply it
    if (limit) {
        query = query.limit(Number(limit));
    }

    const categories = await query;

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





const bestSellingProductsById = asyncHandler(async (req, res) => {
    console.log("🚀 ~ req.body:", req.params)
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }

    // 1️⃣ Fetch user cart orders
    const customer = await Customers.findById(userId);
    const cartOrders = customer?.orders || [];

    // 2️⃣ Fetch all best-selling products
    const bestSellers = await SubCategory.find({ bestSellers: true }).sort({ createdAt: -1 }).lean();

    if (!bestSellers || bestSellers.length === 0) {
        return res.status(404).json({ message: "No best-selling products found" });
    }

    // 3️⃣ Map products and attach cart count if exists
    const productsWithCount = bestSellers.map((product) => {
        const cartItem = cartOrders.find(
            (o) => o.subCategory.toString() === product._id.toString()
        );
        return {
            ...product,
            count: cartItem ? cartItem.count : 0,
        };
    });

    return res.status(200).json(
        new ApiResponse(200, productsWithCount, "Best-selling products fetched successfully")
    );
});


const allCategoriesSubProducts = asyncHandler(async (req, res) => {
    console.log("hello");

    console.log("🚀 ~ req.params:", req.params)
    const { id } = req.params; // Category ID
    const objectId = new mongoose.Types.ObjectId(id);

    // Find the category and populate typeCategories -> subCategories
    const category = await Categories.findById(objectId)
        .populate({
            path: "typeCategories",
            populate: {
                path: "subCategories",
                select: "name img description weight pieces serves price available", // select needed fields
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
    const objectId = new mongoose.Types.ObjectId(id);

    // Find the TypeCategory by ID and populate subCategories
    const typeCategory = await TypeCategory.findById(objectId)
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

// const fullDetailsOfSubCategorieCard = asyncHandler(async (req, res) => {
//     const { id } = req.params; // SubCategory ID
//     const objectId = new mongoose.Types.ObjectId(id);

//     // Find subcategory by ID
//     const subCategory = await SubCategory.findById(objectId);

//     if (!subCategory) {
//         return res.status(404).json(new ApiResponse(404, null, "Subcategory not found"));
//     }

//     // Return full details
//     res.status(200).json(
//         new ApiResponse(200, subCategory, "Subcategory details retrieved successfully")
//     );
// });

const fullDetailsOfSubCategorieCard = asyncHandler(async (req, res) => {
    const { id } = req.params; // SubCategory ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid Subcategory ID"));
    }

    // Find subcategory by ID with only required fields
    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
        return res.status(404).json(new ApiResponse(404, null, "Subcategory not found"));
    }

    res.status(200).json(
        new ApiResponse(200, subCategory, "Subcategory details retrieved successfully")
    );
});



// Controller
// const searchItem = asyncHandler(async (req, res) => {
//     const { name } = req.query; // ?name=...

//     if (!name) {
//         throw new ApiError(400, "Item name is required");
//     }

//     // const items = await SubCategory.find({ name: { $regex: name, $options: "i" } });
//     // Only fetch name and img fields
//     const items = await SubCategory.find(
//         { name: { $regex: name, $options: "i" } },
//         { name: 1, img: 1, _id: 0 } // projection: include name & img, exclude _id
//     );

//     return res.status(200).json(new ApiResponse(200, items, "Items fetched successfully"));
// });

const searchItem = asyncHandler(async (req, res) => {
    const { name } = req.query; // ?name=...

    if (!name) {
        throw new ApiError(400, "Item name is required");
    }

    // ✅ Fetch only the required fields
    const items = await SubCategory.find(
        { name: { $regex: name, $options: "i" } },
        {
            name: 1,
            img: 1,
            weight: 1,
            price: 1,
            discount: 1,
            discountPrice: 1,
            _id: 0 // hide _id if you don’t need it
        }
    );

    return res.status(200).json(
        new ApiResponse(200, items, "Items fetched successfully")
    );
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

export const displayAllSubCategory = asyncHandler(async (req, res) => {
    try {
        // Fetch all subcategories
        const subCategories = await SubCategory.find()
            .populate("quantity.managerId", "firstName lastName img phone") // populate manager details
            .sort({ createdAt: -1 }); // latest first

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
    // allCategoriesWithCount,

    bestSellingProducts,
    bestSellingProductsById,

    allCategoriesSubProducts,
    categoriesTypes,
    typeCategoriesAllCard,
    fullDetailsOfSubCategorieCard,
    searchItem,
    allSubCategories_bottom_search,
    displayAllSubCategory
};