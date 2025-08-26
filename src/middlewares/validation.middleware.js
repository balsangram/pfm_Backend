import { ApiError } from '../utils/ApiError.js';

/**
 * Generic validation middleware using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        try {
            console.log('🔍 validateRequest: Starting validation...');
            console.log('🔍 validateRequest: Property to validate:', property);
            console.log('🔍 validateRequest: Request body:', req.body);
            console.log('🔍 validateRequest: Request property value:', req[property]);
            console.log('🔍 validateRequest: Request property type:', typeof req[property]);
            console.log('🔍 validateRequest: Schema:', schema ? 'Schema exists' : 'No schema');
            
            // Special handling for query parameters - allow empty queries
            if (property === 'query' && (!req[property] || Object.keys(req[property]).length === 0)) {
                console.log('✅ validateRequest: Empty query parameters allowed, skipping validation');
                // Set default empty object for empty queries
                req[property] = {};
                return next();
            }
            
            // Check if the property exists and has content (only for body and params)
            if (property !== 'query' && (!req[property] || (typeof req[property] === 'object' && Object.keys(req[property]).length === 0))) {
                console.log('❌ validateRequest: Property is empty or undefined');
                throw new ApiError(400, `Validation Error: ${property} is required`);
            }
            
            // Check if schema is valid
            if (!schema || typeof schema.validate !== 'function') {
                console.log('❌ validateRequest: Invalid schema provided');
                throw new ApiError(500, 'Validation Error: Invalid schema configuration');
            }
            
            const { error, value } = schema.validate(req[property], {
                abortEarly: false,
                stripUnknown: true,
                allowUnknown: true // Allow unknown properties for query parameters
            });

            if (error) {
                console.log('❌ validateRequest: Validation failed:', error.details);
                const errorMessage = error.details
                    .map(detail => detail.message)
                    .join(', ');
                
                throw new ApiError(400, `Validation Error: ${errorMessage}`);
            }

            console.log('✅ validateRequest: Validation passed, value:', value);
            // Replace the request property with validated data
            req[property] = value;
            next();
        } catch (error) {
            console.log('❌ validateRequest: Error caught:', error.message);
            next(error);
        }
    };
};

/**
 * Validate multiple request properties at once
 * @param {Object} schemas - Object with property names as keys and Joi schemas as values
 * @returns {Function} Express middleware function
 */
export const validateMultiple = (schemas) => {
    return (req, res, next) => {
        try {
            for (const [property, schema] of Object.entries(schemas)) {
                if (schema && req[property]) {
                    // Special handling for query parameters - allow empty queries
                    if (property === 'query' && Object.keys(req[property]).length === 0) {
                        console.log('✅ validateMultiple: Empty query parameters allowed, skipping validation');
                        continue;
                    }
                    
                    const { error, value } = schema.validate(req[property], {
                        abortEarly: false,
                        stripUnknown: true,
                        allowUnknown: true // Allow unknown properties for query parameters
                    });

                    if (error) {
                        const errorMessage = error.details
                            .map(detail => detail.message)
                            .join(', ');
                        
                        throw new ApiError(400, `Validation Error in ${property}: ${errorMessage}`);
                    }

                    req[property] = value;
                }
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
