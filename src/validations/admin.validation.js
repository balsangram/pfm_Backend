import Joi from 'joi';

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

import joi from 'joi';


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


// Subcategory update validation
export const subCategorySchemaEdit = joi.object({
    subId: joi.string()
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
            "string.uri": `"img" must be a valid URL`
        })
});
