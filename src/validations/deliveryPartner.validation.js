import Joi from "joi";

// Validation for creating new delivery partner
export const createDeliveryPartnerValidation = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required()
        .messages({
            'any.required': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'string.trim': 'Name cannot contain leading or trailing spaces'
        }),
    phone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .trim()
        .required()
        .messages({
            'any.required': 'Phone number is required',
            'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
            'string.trim': 'Phone number cannot contain leading or trailing spaces'
        })
});

// Validation for updating delivery partner profile
export const updateProfileValidation = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .optional()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'string.trim': 'Name cannot contain leading or trailing spaces'
        }),
    phone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .trim()
        .optional()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
            'string.trim': 'Phone number cannot contain leading or trailing spaces'
        })
}).min(1).messages({
    'object.min': 'At least one field is required to update'
});

// Validation for document verification status update
export const documentVerificationValidation = Joi.object({
    documentType: Joi.string()
        .valid('idProof', 'addressProof', 'vehicleDocuments', 'drivingLicense', 'insuranceDocuments')
        .required()
        .messages({
            'any.required': 'Document type is required',
            'any.only': 'Document type must be one of: idProof, addressProof, vehicleDocuments, drivingLicense, insuranceDocuments'
        }),
    status: Joi.string()
        .valid('verified', 'pending', 'rejected')
        .required()
        .messages({
            'any.required': 'Status is required',
            'any.only': 'Status must be one of: verified, pending, rejected'
        }),
    notes: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
});

// Validation for bulk document verification update
export const bulkDocumentVerificationValidation = Joi.object({
    documents: Joi.array()
        .items(Joi.object({
            documentType: Joi.string()
                .valid('idProof', 'addressProof', 'vehicleDocuments', 'drivingLicense', 'insuranceDocuments')
                .required()
                .messages({
                    'any.required': 'Document type is required for each document',
                    'any.only': 'Document type must be one of: idProof, addressProof, vehicleDocuments, drivingLicense, insuranceDocuments'
                }),
            status: Joi.string()
                .valid('verified', 'pending', 'rejected')
                .required()
                .messages({
                    'any.required': 'Status is required for each document',
                    'any.only': 'Status must be one of: verified, pending, rejected'
                }),
            notes: Joi.string()
                .max(500)
                .optional()
                .messages({
                    'string.max': 'Notes cannot exceed 500 characters'
                })
        }))
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one document is required',
            'any.required': 'Documents array is required'
        })
});

// Validation for updating delivery partner status
export const updateStatusValidation = Joi.object({
    status: Joi.string()
        .valid('verified', 'pending')
        .required()
        .messages({
            'any.required': 'Status is required',
            'any.only': 'Status must be either verified or pending'
        })
});

// Validation for document upload
export const documentUploadValidation = Joi.object({
    documentType: Joi.string()
        .valid('idProof', 'addressProof', 'vehicleDocuments', 'drivingLicense', 'insuranceDocuments')
        .required()
        .messages({
            'any.required': 'Document type is required',
            'any.only': 'Document type must be one of: idProof, addressProof, vehicleDocuments, drivingLicense, insuranceDocuments'
        }),
    documentUrl: Joi.string()
        .uri()
        .required()
        .messages({
            'any.required': 'Document URL is required',
            'string.uri': 'Please provide a valid document URL'
        })
});

// Validation for query parameters in getAllDeliveryPartners
export const getAllDeliveryPartnersQueryValidation = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .optional()
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    status: Joi.string()
        .valid('verified', 'pending')
        .optional()
        .messages({
            'any.only': 'Status must be either verified or pending'
        }),
    overallDocumentStatus: Joi.string()
        .valid('verified', 'pending', 'rejected')
        .optional()
        .messages({
            'any.only': 'Overall document status must be one of: verified, pending, rejected'
        }),
    search: Joi.string()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Search query cannot exceed 100 characters'
        })
});

// Delivery partner QR flow validations
export const scanQrValidation = Joi.object({
    code: Joi.string()
        .max(200)
        .required()
        .messages({
            'any.required': 'QR code payload is required'
        })
});

export const respondOrderValidation = Joi.object({
    orderId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format',
            'any.required': 'Order ID is required'
        }),
    action: Joi.string()
        .valid('accept', 'reject')
        .required()
        .messages({
            'any.only': 'Action must be either accept or reject',
            'any.required': 'Action is required'
        })
});

// Initiate delivery validation
export const initiateDeliveryValidation = Joi.object({
    orderId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format',
            'any.required': 'Order ID is required'
        })
});

// Mark order delivered validation
export const markDeliveredValidation = Joi.object({
    orderId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format',
            'any.required': 'Order ID is required'
        })
});

// Reject delivery validation
export const rejectDeliveryValidation = Joi.object({
    orderId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format',
            'any.required': 'Order ID is required'
        }),
    reason: Joi.string()
        .valid('customer_not_available', 'wrong_address', 'payment_issue', 'order_cancelled', 'other')
        .required()
        .messages({
            'any.only': 'Invalid rejection reason',
            'any.required': 'Rejection reason is required'
        }),
    notes: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
});

// Edit profile validation
export const editProfileValidation = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'string.trim': 'Name cannot contain leading or trailing spaces',
            'any.required': 'Name is required'
        })
});