import Joi from 'joi';
import joi from 'joi';
import mongoose from 'mongoose';

// Meat Center Validation Schemas
export const createMeatCenterSchema = Joi.object({
    storeName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Store name must be at least 2 characters long',
            'string.max': 'Store name cannot exceed 100 characters',
            'any.required': 'Store name is required'
        }),
    location: Joi.string()
        .min(5)
        .max(300)
        .required()
        .messages({
            'string.min': 'Location must be at least 5 characters long',
            'string.max': 'Location cannot exceed 300 characters',
            'any.required': 'Location is required'
        }),
    managerPhone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
            'any.required': 'Manager phone number is required'
        }),
    storePhone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
            'any.required': 'Store phone number is required'
        }),
    managerFirstName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Manager first name must be at least 2 characters long',
            'string.max': 'Manager first name cannot exceed 50 characters',
            'any.required': 'Manager first name is required'
        }),
    managerLastName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Manager last name must be at least 2 characters long',
            'string.max': 'Manager last name cannot exceed 50 characters',
            'any.required': 'Manager last name is required'
        }),
    managerEmail: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Manager email is required'
        }),
    latitude: Joi.string()
        .pattern(/^-?([1-8]?[0-9](\.[0-9]+)?|90(\.0+)?)$/)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid latitude (-90 to 90)',
            'any.required': 'Latitude is required'
        }),
    longitude: Joi.string()
        .pattern(/^-?((1[0-7][0-9]|[1-9]?[0-9])(\.[0-9]+)?|180(\.0+)?)$/)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid longitude (-180 to 180)',
            'any.required': 'Longitude is required'
        }),
    products: Joi.object({
        chicken: Joi.boolean().default(false),
        mutton: Joi.boolean().default(false),
        pork: Joi.boolean().default(false),
        fish: Joi.boolean().default(false),
        meat: Joi.boolean().default(false)
    }).default({
        chicken: false,
        mutton: false,
        pork: false,
        fish: false,
        meat: false
    })
});

export const updateMeatCenterSchema = Joi.object({
    storeName: Joi.string()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Store name must be at least 2 characters long',
            'string.max': 'Store name cannot exceed 100 characters'
        }),
    location: Joi.string()
        .min(5)
        .max(300)
        .messages({
            'string.min': 'Location must be at least 5 characters long',
            'string.max': 'Location cannot exceed 300 characters'
        }),
    managerPhone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number (10-15 digits)'
        }),
    storePhone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number (10-15 digits)'
        }),
    managerFirstName: Joi.string()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'Manager first name must be at least 2 characters long',
            'string.max': 'Manager first name cannot exceed 50 characters'
        }),
    managerLastName: Joi.string()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'Manager last name must be at least 2 characters long',
            'string.max': 'Manager last name cannot exceed 50 characters'
        }),
    managerEmail: Joi.string()
        .email()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),
    pincode: Joi.string()
        .pattern(/^[0-9]{6}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid 6-digit pincode'
        }),
    latitude: Joi.string()
        .pattern(/^-?([1-8]?[0-9](\.[0-9]+)?|90(\.0+)?)$/)
        .messages({
            'string.pattern.base': 'Please provide a valid latitude (-90 to 90)'
        }),
    longitude: Joi.string()
        .pattern(/^-?((1[0-7][0-9]|[1-9]?[0-9])(\.[0-9]+)?|180(\.0+)?)$/)
        .messages({
            'string.pattern.base': 'Please provide a valid longitude (-180 to 180)'
        }),
    products: Joi.object({
        chicken: Joi.boolean(),
        mutton: Joi.boolean(),
        pork: Joi.boolean(),
        fish: Joi.boolean(),
        meat: Joi.boolean()
    })
});

export const idParamSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid ID format',
            'any.required': 'ID is required'
        })
});


export const meatCenterSchemaAdd = joi.object({
    firstName: joi.string().min(2).max(50).required(),
    lastName: joi.string().min(2).max(50),
    email: joi.string().email().required(),
    phone: joi.string().min(10).max(15),
    storeName: joi.string().min(3).max(100).required(),
    storeLocation: joi.string().min(10).max(300).required(),
    lat: joi.number().required(),
    long: joi.number().required(),
    Products: joi.array().items(joi.string().min(1).max(100)).required()
});
export const meatCenterSchemaEdit = joi.object({
    firstName: joi.string().min(2).max(50),
    lastName: joi.string().min(2).max(50),
    email: joi.string().email(),
    phone: joi.string().min(10).max(15),
    storeName: joi.string().min(3).max(100),
    storeLocation: joi.string().min(10).max(300),
    lat: joi.number(),
    long: joi.number(),
    Products: joi.array().items(joi.string().min(1).max(100))
});


// Product Categories 

export const productCategorySchemaAdd = joi.object({
    name: joi.string().min(2).max(100).required().messages({
        "string.empty": `"name" cannot be empty`,
        "any.required": `"name" is required`
    }),
    img: joi.string().uri().messages({
        "string.empty": `"img" cannot be empty`,
        "string.uri": `"img" must be a valid URL`
    }),
    // img: joi.string().uri().required().messages({
    //     "string.empty": `"img" cannot be empty`,
    //     "any.required": `"img" is required`,
    //     "string.uri": `"img" must be a valid URL`
    // }),
});

export const productCategorySchemaEdit = joi.object({
    name: joi.string()
        .min(2)
        .max(100)
        .messages({
            "string.base": `"name" should be a type of 'text'`,
            "string.min": `"name" should have at least {#limit} characters`,
            "string.max": `"name" should have at most {#limit} characters`
        }),
    img: joi.string()
        .uri()
        .messages({
            "string.base": `"img" should be a type of 'text'`,
            "string.uri": `"img" must be a valid URL`
        })
});


export const typeCategorySchemaAdd = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        "string.empty": `"name" cannot be empty`,
        "any.required": `"name" is required`
    }),
    img: Joi.string().uri().messages({
        "string.empty": `"img" cannot be empty`,
        "string.uri": `"img" must be a valid URL`
    }),
});

export const typeCategorySchemaEdit = Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
        "string.empty": `"name" cannot be empty`,
    }),
    img: Joi.string().uri().optional().messages({
        "string.empty": `"img" cannot be empty`,
        "string.uri": `"img" must be a valid URL`
    })
});

// Validation schema for adding a subcategory

export const subProductCategorySchemaAdd = Joi.object({
    images: Joi.array().items(Joi.string().uri()).optional().messages({
        "array.base": `"images" must be an array`,
        "string.uri": `"images" must contain valid URLs`
    }),
    name: Joi.string().min(2).max(100).required().messages({
        "string.empty": `"name" cannot be empty`,
        "any.required": `"name" is required`
    }),
    type: Joi.string().required().messages({
        "string.empty": `"type" cannot be empty`,
        "any.required": `"type" is required`
    }),
    quality: Joi.string().allow("").optional(),
    description: Joi.string().required().messages({
        "string.empty": `"description" cannot be empty`,
        "any.required": `"description" is required`
    }),
    weight: Joi.string().required().messages({
        "string.empty": `"weight" cannot be empty`,
        "any.required": `"weight" is required`
    }),
    pieces: Joi.number().required().messages({
        "number.base": `"pieces" must be a number`,
        "any.required": `"pieces" is required`
    }),
    serves: Joi.number().required().messages({
        "number.base": `"serves" must be a number`,
        "any.required": `"serves" is required`
    }),
    totalEnergy: Joi.number().required().messages({
        "number.base": `"totalEnergy" must be a number`,
        "any.required": `"totalEnergy" is required`
    }),
    carbohydrate: Joi.number().default(0).optional(),
    fat: Joi.number().default(0).optional(),
    protein: Joi.number().default(0).optional(),
    price: Joi.number().required().messages({
        "number.base": `"price" must be a number`,
        "any.required": `"price" is required`
    })
});

export const subCategorySchemaEdit = Joi.object({
    subId: Joi.string()
        .required()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error("any.invalid");
            }
            return value;
        })
        .messages({
            "any.invalid": `"subId" must be a valid MongoDB ObjectId`,
            "any.required": `"subId" is required`
        }),
    images: Joi.array().items(Joi.string().uri()).optional().messages({
        "array.base": `"images" must be an array`,
        "string.uri": `"images" must contain valid URLs`
    }),
    name: Joi.string().min(2).max(100).optional(),
    type: Joi.string().optional(),
    quality: Joi.string().optional(),
    description: Joi.string().optional(),
    weight: Joi.string().optional(),
    pieces: Joi.number().optional(),
    serves: Joi.number().optional(),
    totalEnergy: Joi.number().optional(),
    carbohydrate: Joi.number().optional(),
    fat: Joi.number().optional(),
    protein: Joi.number().optional(),
    price: Joi.number().optional()
});
