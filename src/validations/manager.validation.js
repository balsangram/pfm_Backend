import Joi from 'joi';

// Manager Authentication Validation Schemas
export const managerSendOtpSchema = Joi.object({
	phone: Joi.string()
		.pattern(/^[0-9]{10,15}$/)
		.required()
		.messages({
			'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
			'any.required': 'Phone number is required'
		})
});

export const managerVerifyLoginSchema = Joi.object({
	phone: Joi.string()
		.pattern(/^[0-9]{10,15}$/)
		.required()
		.messages({
			'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
			'any.required': 'Phone number is required'
		}),
	otp: Joi.string()
		.pattern(/^[0-9]{4}$/)
		.required()
		.messages({
			'string.pattern.base': 'OTP must be a 4-digit number',
			'any.required': 'OTP is required'
		}),
	userId: Joi.string()
		.pattern(/^[0-9a-fA-F]{24}$/)
		.required()
		.messages({
			'string.pattern.base': 'Invalid user ID format',
			'any.required': 'User ID is required'
		})
});

// Manager Profile Validation Schemas
export const updateProfileSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    location: Joi.string().min(5).max(200).required().messages({
        'string.min': 'Location must be at least 5 characters long',
        'string.max': 'Location cannot exceed 200 characters',
        'any.required': 'Location is required'
    }),
    userLocation: Joi.string().min(5).max(200).required().messages({
        'string.min': 'User location must be at least 5 characters long',
        'string.max': 'User location cannot exceed 200 characters',
        'any.required': 'User location is required'
    }),
    storeName: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Store name must be at least 3 characters long',
        'string.max': 'Store name cannot exceed 100 characters',
        'any.required': 'Store name is required'
    }),
    storeLocation: Joi.string().min(10).max(300).required().messages({
        'string.min': 'Store location must be at least 10 characters long',
        'string.max': 'Store location cannot exceed 300 characters',
        'any.required': 'Store location is required'
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(15).required().messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.min': 'Phone number must be at least 10 digits',
        'string.max': 'Phone number cannot exceed 15 digits',
        'any.required': 'Phone number is required'
    }),
    address: Joi.string().min(10).max(300).required().messages({
        'string.min': 'Address must be at least 10 characters long',
        'string.max': 'Address cannot exceed 300 characters',
        'any.required': 'Address is required'
    })
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().min(6).required().messages({
        'string.min': 'Current password must be at least 6 characters long',
        'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).max(128).required().messages({
        'string.min': 'New password must be at least 6 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'any.required': 'New password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Please confirm your new password'
    })
});

// Delivery Partner Validation Schemas
export const createDeliveryPartnerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
    }),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(15).required().messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.min': 'Phone number must be at least 10 digits',
        'string.max': 'Phone number cannot exceed 15 digits',
        'any.required': 'Phone number is required'
    }),
    status: Joi.string().valid('verified', 'pending').default('pending').messages({
        'any.only': 'Status must be either verified or pending'
    })
});

export const updateDeliveryPartnerSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
    }),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(15).optional().messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.min': 'Phone number must be at least 10 digits',
        'string.max': 'Phone number cannot exceed 15 digits'
    }),
    status: Joi.string().valid('verified', 'pending').optional().messages({
        'any.only': 'Status must be either verified or pending'
    })
});

// Order Management Validation Schemas
export const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled').required().messages({
        'any.only': 'Invalid order status',
        'any.required': 'Order status is required'
    }),
    pickedUpBy: Joi.string().min(2).max(100).optional().messages({
        'string.min': 'Picked up by name must be at least 2 characters long',
        'string.max': 'Picked up by name cannot exceed 100 characters'
    }),
    notes: Joi.string().max(500).optional().messages({
        'string.max': 'Notes cannot exceed 500 characters'
    })
});

export const orderFilterSchema = Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled').optional().allow(''),
    dateFrom: Joi.date().iso().optional().allow('').messages({
        'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
    }),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional().allow('').messages({
        'date.min': 'End date must be after start date'
    }),
    search: Joi.string().max(100).optional().allow('').messages({
        'string.max': 'Search term cannot exceed 100 characters'
    }),
    page: Joi.number().integer().min(1).default(1).optional().allow('').messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).optional().allow('').messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    })
}).unknown(true); // Allow unknown query parameters

// Store Management Validation Schemas
export const updateStoreSchema = Joi.object({
    name: Joi.string().min(3).max(100).optional().messages({
        'string.min': 'Store name must be at least 3 characters long',
        'string.max': 'Store name cannot exceed 100 characters'
    }),
    location: Joi.string().min(10).max(300).optional().messages({
        'string.min': 'Store location must be at least 10 characters long',
        'string.max': 'Store location cannot exceed 300 characters'
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(15).optional().messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.min': 'Phone number must be at least 10 digits',
        'string.max': 'Phone number cannot exceed 15 digits'
    })
});

// Generic ID validation
export const idParamSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'Invalid ID format',
        'any.required': 'ID is required'
    })
});
