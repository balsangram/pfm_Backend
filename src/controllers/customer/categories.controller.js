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


// const bestSellingProducts = asyncHandler(async (req, res) => {
//     // Fetch all subcategories where bestSellers is true
//     const bestSellers = await SubCategory.find({ bestSellers: true }).sort({ createdAt: -1 }); // newest first

//     if (!bestSellers || bestSellers.length === 0) {
//         return res.status(404).json({ message: "No best-selling products found" });
//     }

//     res.status(200).json(bestSellers);
// });


// export const bestSellingProducts = asyncHandler(async (req, res) => {
//     const { userId } = req.query; // optional

//     // 1️⃣ Fetch best sellers
//     let bestSellers = await SubCategory.find({ bestSellers: true })
//         .sort({ createdAt: -1 })
//         .lean(); // lean() → plain JS objects (so we can modify)

//     if (!bestSellers || bestSellers.length === 0) {
//         return res.status(404).json({ message: "No best-selling products found" });
//     }

//     // 2️⃣ If userId is provided → fetch customer's orders and map counts
//     if (userId && mongoose.Types.ObjectId.isValid(userId)) {
//         const customer = await Customers.findById(userId).select("orders");

//         if (customer) {
//             const orderMap = new Map();
//             customer.orders.forEach(order => {
//                 orderMap.set(order.subCategory.toString(), order.count);
//             });

//             bestSellers = bestSellers.map(sub => ({
//                 ...sub,
//                 count: orderMap.get(sub._id.toString()) || 0, // add count
//             }));
//         }
//     } else {
//         // No userId → default count 0
//         bestSellers = bestSellers.map(sub => ({
//             ...sub,
//             count: 0,
//         }));
//     }

//     res.status(200).json(bestSellers);
// });


export const bestSellingProducts = asyncHandler(async (req, res) => {
    const { userId } = req.query;

    // 1️⃣ Fetch best sellers but exclude `quantity`
    let bestSellers = await SubCategory.find({ bestSellers: true })
        .sort({ createdAt: -1 })
        .select("-quantity")
        .lean();

    if (!bestSellers || bestSellers.length === 0) {
        return res.status(404).json({ message: "No best-selling products found" });
    }

    // 2️⃣ Add count based on userId
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const customer = await Customers.findById(userId).select("orders");

        if (customer) {
            const orderMap = new Map();
            customer.orders.forEach(order => {
                orderMap.set(order.subCategory.toString(), order.count);
            });

            bestSellers = bestSellers.map(sub => ({
                ...sub,
                count: orderMap.get(sub._id.toString()) || 0
            }));
        }
    } else {
        bestSellers = bestSellers.map(sub => ({
            ...sub,
            count: 0
        }));
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


// const allCategoriesSubProducts = asyncHandler(async (req, res) => {
//     console.log("hello");

//     console.log("🚀 ~ req.params:", req.params)
//     const { id } = req.params; // Category ID
//     const objectId = new mongoose.Types.ObjectId(id);

//     // Find the category and populate typeCategories -> subCategories
//     const category = await Categories.findById(objectId)
//         .populate({
//             path: "typeCategories",
//             populate: {
//                 path: "subCategories",
//                 select: "name img description weight pieces serves price available", // select needed fields
//             },
//         });

//     if (!category) {
//         return res.status(404).json(new ApiResponse(404, null, "Category not found"));
//     }

//     // Collect all subcategories from all typeCategories
//     const allSubCategories = [];
//     category.typeCategories.forEach(tc => {
//         allSubCategories.push(...tc.subCategories);
//     });

//     res.status(200).json(
//         new ApiResponse(200, allSubCategories, "Sub-products retrieved successfully")
//     );
// });

const allCategoriesSubProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;          // category id
    const { userId } = req.query;       // optional userId
    console.log("🚀 ~ userId:", userId)

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid category ID"));
    }

    // 1️⃣ Fetch the category + subcategories
    const category = await Categories.findById(id).populate({
        path: "typeCategories",
        populate: {
            path: "subCategories",
            select: "name img description weight pieces serves price available",
        },
    });

    if (!category) {
        return res.status(404).json(new ApiResponse(404, null, "Category not found"));
    }

    // Collect all subcategories
    let allSubCategories = [];
    category.typeCategories.forEach(tc => {
        allSubCategories.push(...tc.subCategories.map(sc => sc.toObject())); // convert to plain object
    });

    // 2️⃣ If userId is provided → fetch customer orders & merge counts
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const customer = await Customers.findById(userId).select("orders");

        if (customer) {
            // Create a map of subCategoryId → count
            const orderMap = new Map();
            customer.orders.forEach(order => {
                orderMap.set(order.subCategory.toString(), order.count);
            });

            // Attach count to each subCategory (default 0 if not ordered yet)
            allSubCategories = allSubCategories.map(sub => ({
                ...sub,
                count: orderMap.get(sub._id.toString()) || 0,
            }));
            console.log("🚀 ~ allSubCategories:", allSubCategories)
        }
    } else {
        console.log("krll")
        // If no userId, just set count = 0 for all
        allSubCategories = allSubCategories.map(sub => ({
            ...sub,
            count: 0,
        }));
    }

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

// const typeCategoriesAllCard = asyncHandler(async (req, res) => {
//     const { id } = req.params; // TypeCategory ID
//     const objectId = new mongoose.Types.ObjectId(id);

//     // Find the TypeCategory by ID and populate subCategories
//     const typeCategory = await TypeCategory.findById(objectId)
//         .select("name subCategories")
//         .populate({
//             path: "subCategories",
//             select: "name img description weight pieces serves price",
//         });

//     if (!typeCategory) {
//         return res.status(404).json(new ApiResponse(404, null, "Type category not found"));
//     }

//     res.status(200).json(
//         new ApiResponse(200, typeCategory, "Type category with sub-products retrieved successfully")
//     );
// });

const typeCategoriesAllCard = asyncHandler(async (req, res) => {
    const { id } = req.params;   // typeCategoryId
    const { userId } = req.query; // optional userId

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid type category ID"));
    }

    // 1️⃣ Find typeCategory and populate subCategories (hide quantity field)
    const typeCategory = await TypeCategory.findById(id)
        .select("name subCategories")
        .populate({
            path: "subCategories",
            select: "name img description weight pieces serves price available", // hide quantity
        })
        .lean();

    if (!typeCategory) {
        return res.status(404).json(new ApiResponse(404, null, "Type category not found"));
    }

    let subCategories = typeCategory.subCategories;

    // 2️⃣ If userId is provided → fetch counts from customer.orders
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const customer = await Customers.findById(userId).select("orders");

        if (customer) {
            const orderMap = new Map();
            customer.orders.forEach(order => {
                orderMap.set(order.subCategory.toString(), order.count);
            });

            subCategories = subCategories.map(sub => ({
                ...sub,
                count: orderMap.get(sub._id.toString()) || 0,
            }));
        }
    } else {
        // Default → set count = 0
        subCategories = subCategories.map(sub => ({
            ...sub,
            count: 0,
        }));
    }

    // 3️⃣ Replace subCategories with enriched version
    typeCategory.subCategories = subCategories;

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

// export const displayAllSubCategory = asyncHandler(async (req, res) => {
//     try {
//         // Fetch all subcategories
//         const subCategories = await SubCategory.find()
//             .populate("quantity.managerId", "firstName lastName img phone") // populate manager details
//             .sort({ createdAt: -1 }); // latest first

//         if (!subCategories || subCategories.length === 0) {
//             throw new ApiError(404, "No subcategories found");
//         }

//         return res
//             .status(200)
//             .json(new ApiResponse(200, subCategories, "Subcategories fetched successfully"));
//     } catch (error) {
//         throw new ApiError(500, error.message || "Failed to fetch subcategories");
//     }
// });

const displayAllSubCategory = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.query;

        // 1️⃣ Fetch all subcategories but exclude "quantity"
        let subCategories = await SubCategory.find()
            .select("-quantity") // 🚀 hide quantity completely
            .sort({ createdAt: -1 })
            .lean();

        if (!subCategories || subCategories.length === 0) {
            throw new ApiError(404, "No subcategories found");
        }

        // 2️⃣ If userId is provided, attach count from customer.orders
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            const customer = await Customers.findById(userId).select("orders");

            if (customer) {
                const orderMap = new Map();
                customer.orders.forEach(order => {
                    orderMap.set(order.subCategory.toString(), order.count);
                });

                subCategories = subCategories.map(sub => ({
                    ...sub,
                    count: orderMap.get(sub._id.toString()) || 0,
                }));
            }
        } else {
            // 3️⃣ No userId → all counts = 0
            subCategories = subCategories.map(sub => ({
                ...sub,
                count: 0,
            }));
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