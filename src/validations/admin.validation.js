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
