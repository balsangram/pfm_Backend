import mongoose from "mongoose";
import Categories from "../../models/catalog/categories.model.js"
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import SubCategory from "../../models/catalog/subCategorySchema.model.js"
import TypeCategory from "../../models/catalog/typeCategories.model.js";
import { uploadBufferToCloudinary } from "../../utils/cloudinary.js";

// categories 

const getProductCategories = asyncHandler(async (req, res) => {
    // Fetch only name and img
    const categories = await Categories.find().select("name img");
    res.status(200).json(
        new ApiResponse(200, categories, "Product categories retrieved successfully")
    );
});

// const createProductCategory = asyncHandler(async (req, res) => {
//     const { name, img } = req.body;
//     console.log("🚀 ~  req.body:", req.body)

//     // Check if category already exists
//     const existingCategory = await Categories.findOne({ name });
//     if (existingCategory) {
//         throw new ApiError(400, "Category with this name already exists");
//     }

//     // Create new category
//     const category = await Categories.create({ name, images: [img] });

//     // Pick only name and images
//     const responseData = {
//         name: category.name,
//         images: category.images,
//     };

//     // Send structured response
//     res.status(201).json(new ApiResponse(201, responseData, "Category created successfully"));
// });

const createProductCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    console.log("🚀 ~ req.body:", req.body);
    console.log("🚀 ~ req.files:", req.files); // Don't use .buffer here

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Category name is required");
    }

    const existingCategory = await Categories.findOne({ name: name.trim() });
    if (existingCategory) {
        throw new ApiError(400, "Category with this name already exists");
    }

    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
        uploadedImages = await Promise.all(
            req.files.map(async (file) => {
                try {
                    // file.buffer is available here because of multer.memoryStorage()
                    const result = await uploadBufferToCloudinary(file.buffer);
                    return result.secure_url;
                } catch (error) {
                    console.error("Cloudinary upload failed:", error);
                    throw new ApiError(500, "Image upload failed");
                }
            })
        );
    }

    const category = await Categories.create({
        name: name.trim(),
        // 🔑 IMPORTANT: schema expects `img`, not `images`
        img: uploadedImages[0] || null, // store only first image
        // or if you want multiple images, update schema to `images: [String]`
    });
    console.log("🚀 ~ category:", category);

    res.status(201).json(
        new ApiResponse(
            201,
            {
                _id: category._id,
                name: category.name,
                img: category.img,
            },
            "Category created successfully"
        )
    );
});

const updateProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, img: existingImg } = req.body; // existing image URL fallback
    let img;

    console.log("🚀 ~ req.file:", req.file);
    console.log("🚀 ~ req.body:", req.body);

    // ✅ Handle new uploaded image using buffer + Cloudinary
    if (req.file) {
        try {
            const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
            img = uploadResult.secure_url;
        } catch (error) {
            console.error("Cloudinary upload failed:", error);
            throw new ApiError(500, "Image upload failed");
        }
    } else {
        img = existingImg; // fallback if no new file
    }

    // ✅ Build update object dynamically
    const updateData = { name };
    if (img) updateData.img = img;

    const updatedCategory = await Categories.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).select("name img");

    if (!updatedCategory) {
        throw new ApiError(404, "Category not found");
    }

    res.status(200).json(
        new ApiResponse(200, updatedCategory, "Category updated successfully")
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

// const createTypeCategory = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     // Validate category ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         throw new ApiError(400, "Invalid category ID");
//     }

//     // Find parent category
//     const category = await Categories.findById(id).populate("typeCategories");
//     if (!category) {
//         throw new ApiError(404, "Parent category not found");
//     }

//     const { name, img } = req.body;

//     // Check for duplicate type category name under this category
//     const exists = category.typeCategories.some(
//         (tc) => tc.name.toLowerCase() === name.trim().toLowerCase()
//     );
//     if (exists) {
//         throw new ApiError(400, "Type category with this name already exists");
//     }

//     // Create TypeCategory document
//     const typeCategory = await TypeCategory.create({
//         name: name.trim(),
//         img: img?.trim() || "",
//         subCategories: [],
//     });

//     // Push TypeCategory _id into category
//     category.typeCategories.push(typeCategory._id);
//     await category.save();

//     res.status(201).json(
//         new ApiResponse(201, typeCategory, "Type category added successfully")
//     );
// });

const createTypeCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(req.file, "filr");


    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid category ID");
    }

    // Find parent category
    const category = await Categories.findById(id).populate("typeCategories");
    if (!category) {
        throw new ApiError(404, "Parent category not found");
    }

    const { name } = req.body;
    let img = "";

    // ✅ Upload image if file is provided
    if (req.file) {
        try {
            const result = await uploadBufferToCloudinary(req.file.buffer);
            img = result.secure_url;
        } catch (error) {
            console.error("Cloudinary upload failed:", error);
            throw new ApiError(500, "Image upload failed");
        }
    } else if (req.body.img) {
        img = req.body.img; // fallback to URL if sent in body
    }

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
        img,
        subCategories: [],
    });

    // Push TypeCategory _id into parent category
    category.typeCategories.push(typeCategory._id);
    await category.save();

    res.status(201).json(
        new ApiResponse(201, typeCategory, "Type category added successfully")
    );
});


const updateTypeCategory = asyncHandler(async (req, res) => {
    const { id } = req.params; // typeCategoryId
    const { name } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid type category ID");
    }

    // Find the parent category that includes this typeCategory
    const category = await Categories.findOne({ typeCategories: id });
    if (!category) {
        throw new ApiError(404, "Parent category not found");
    }

    // Handle image upload if a new file is provided
    let img;
    if (req.file) {
        try {
            const result = await uploadBufferToCloudinary(req.file.buffer);
            img = result.secure_url;
        } catch (error) {
            console.error("Cloudinary upload failed:", error);
            throw new ApiError(500, "Image upload failed");
        }
    } else if (req.body.img) {
        img = req.body.img; // fallback if an image URL is provided
    }

    // Build update object dynamically
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (img) updateData.img = img;

    // Update TypeCategory
    const typeCategory = await TypeCategory.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    if (!typeCategory) {
        throw new ApiError(404, "Type category not found");
    }

    res.status(200).json(
        new ApiResponse(200, typeCategory, "Type category updated successfully")
    );
});


// const deleteTypeCategory = asyncHandler(async (req, res) => {
//     const { id, categoryId } = req.params;
//     console.log("🚀 ~ req.params:", req.params)

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         throw new ApiError(400, "Invalid type category ID");
//     }
//     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
//         throw new ApiError(400, "Invalid category ID");
//     }

//     // Check if TypeCategory exists
//     const typeCategory = await TypeCategory.findById(id);
//     if (!typeCategory) {
//         throw new ApiError(404, "Type category not found");
//     }

//     // Prevent deletion if subCategories are not empty
//     if (typeCategory.subCategories.length > 0) {
//         throw new ApiError(
//             400,
//             "Cannot delete type category with existing subcategories. Please delete subcategories first."
//         );
//     }

//     // Find parent category and ensure it contains this type category
//     const parentCategory = await Categories.findById(categoryId);
//     if (!parentCategory) {
//         throw new ApiError(404, "Parent category not found");
//     }
//     if (!parentCategory.typeCategories.includes(id)) {
//         throw new ApiError(
//             400,
//             "This type category does not belong to the specified parent category."
//         );
//     }

//     // Delete the TypeCategory document
//     await TypeCategory.findByIdAndDelete(id);

//     // Remove reference from parent category
//     parentCategory.typeCategories.pull(id);
//     await parentCategory.save();

//     res.status(200).json(
//         new ApiResponse(200, null, "Type category deleted successfully")
//     );
// });

// sub categories

const deleteTypeCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid type category ID");
    }

    // Check if TypeCategory exists
    const typeCategory = await TypeCategory.findById(id);
    if (!typeCategory) {
        throw new ApiError(404, "Type category not found");
    }

    // Prevent deletion if subCategories exist
    if (typeCategory.subCategories.length > 0) {
        throw new ApiError(
            400,
            "Cannot delete type category with existing subcategories. Please delete subcategories first."
        );
    }

    // Remove from parent category automatically
    await Categories.updateOne(
        { typeCategories: id },
        { $pull: { typeCategories: id } }
    );

    // Delete the typeCategory itself
    await TypeCategory.findByIdAndDelete(id);

    res.status(200).json(
        new ApiResponse(200, null, "Type category deleted successfully")
    );
});


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
            img: sub.img,
        })),
    };
    console.log("🚀 ~ responseData:", responseData)

    res.status(200).json(
        new ApiResponse(200, responseData, "Subcategories retrieved successfully")
    );
});

const createSubProductCategory = asyncHandler(async (req, res) => {
    console.log("Request body:", req.body);
    console.log("Request files:", req.file);

    const { id } = req.params; // Parent TypeCategory ID

    // Validate parent category
    const parentCategory = await TypeCategory.findById(id);
    if (!parentCategory) {
        throw new ApiError(404, "Parent TypeCategory not found");
    }

    // Extract only the necessary fields (minimal for schema compliance)
    const { name = "Default Subcategory", type = [], description = "Default description", weight = "0", pieces = "1", serves = 1, totalEnergy = 0, price = 0 } = req.body;

    // Ensure type is an array
    const typeArray = Array.isArray(type) ? type : type ? [type] : [];

    // Validate required fields (as per SubCategorySchema)
    if (!name || name.trim().length < 2) {
        throw new ApiError(400, "Subcategory name is required and must be at least 2 characters long");
    }
    if (!typeArray.length) {
        throw new ApiError(400, "At least one type is required");
    }
    if (!description || description.trim().length < 5) {
        throw new ApiError(400, "Description is required and must be at least 5 characters long");
    }
    if (!weight) {
        throw new ApiError(400, "Weight is required");
    }
    if (!pieces) {
        throw new ApiError(400, "Pieces is required");
    }
    if (serves < 1) {
        throw new ApiError(400, "Serves must be at least 1");
    }
    if (totalEnergy < 0) {
        throw new ApiError(400, "Total energy cannot be negative");
    }
    if (price < 0) {
        throw new ApiError(400, "Price cannot be negative");
    }

    // Handle image uploads
    let img = "";

    if (req.file) {
        try {
            const result = await uploadBufferToCloudinary(req.file.buffer);
            console.log("🚀 ~ result:", result)
            if (!result.secure_url) {
                throw new ApiError(500, "Failed to upload image to Cloudinary");
            }
            img = result.secure_url;
            console.log("🚀 ~ img:", img)
        } catch (error) {
            console.error("Cloudinary upload erro   r:", error);
            throw new ApiError(500, `Image upload failed: ${error.message}`);
        }
    } else {
        console.warn("No image provided; proceeding without image");
    }


    // Create subcategory document
    const newSubcategory = await SubCategory.create({
        img: img, // Use first image or empty string (as per original schema 'img')
        name,
        type: typeArray,
        quality: "", // Default as per schema
        description,
        weight,
        pieces,
        serves: Number(serves),
        totalEnergy: Number(totalEnergy),
        carbohydrate: 0, // Default as per schema
        fat: 0, // Default as per schema
        protein: 0, // Default as per schema
        price: Number(price),
        bestSellers: false, // Default as per schema
    });

    // Link subcategory to parent category
    parentCategory.subCategories.push(newSubcategory._id);
    await parentCategory.save();

    // Return structured response
    return res.status(201).json(
        new ApiResponse(
            201,
            {
                id: newSubcategory._id,
                name: newSubcategory.name,
                img: newSubcategory.img, // Return single img as per schema
                type: newSubcategory.type,
            },
            "Subcategory created successfully"
        )
    );
});


const updateSubProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params; // SubCategory ID
    console.log("🚀 ~ Updating subcategory:", id);

    let {
        name,
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

    // Ensure type is always an array
    if (!Array.isArray(type)) {
        type = type ? [type] : [];
    }

    // Find existing subcategory
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
        throw new ApiError(404, "Subcategory not found");
    }

    // If new image uploaded, replace it
    let imgUrl = subCategory.img; // keep old image by default
    if (req.file) {
        try {
            const result = await uploadBufferToCloudinary(req.file.buffer);
            imgUrl = result.secure_url;
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            throw new ApiError(500, "Image upload failed");
        }
    }

    // Update fields
    subCategory.name = name || subCategory.name;
    subCategory.type = type.length ? type : subCategory.type;
    subCategory.quality = quality || subCategory.quality;
    subCategory.weight = weight || subCategory.weight;
    subCategory.pieces = pieces || subCategory.pieces;
    subCategory.serves = serves || subCategory.serves;
    subCategory.totalEnergy = totalEnergy || subCategory.totalEnergy;
    subCategory.carbohydrate = carbohydrate || subCategory.carbohydrate;
    subCategory.fat = fat || subCategory.fat;
    subCategory.protein = protein || subCategory.protein;
    subCategory.description = description || subCategory.description;
    subCategory.price = price || subCategory.price;
    subCategory.img = imgUrl;

    const updatedSubCategory = await subCategory.save();

    res.status(200).json(
        new ApiResponse(200, updatedSubCategory, "Subcategory updated successfully")
    );
});


const deleteSubProductCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate subcategory ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid subcategory ID");
    }

    // Find subcategory
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
        throw new ApiError(404, "Subcategory not found");
    }

    // Delete subcategory
    await SubCategory.findByIdAndDelete(id);

    // Also remove reference from its parent category
    await TypeCategory.updateOne(
        { subCategories: id },
        { $pull: { subCategories: id } }
    );

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
