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
            const { error, value } = schema.validate(req[property], {
                abortEarly: false,
                stripUnknown: true,
                allowUnknown: false
            });

            if (error) {
                const errorMessage = error.details
                    .map(detail => detail.message)
                    .join(', ');
                
                throw new ApiError(400, `Validation Error: ${errorMessage}`);
            }

            // Replace the request property with validated data
            req[property] = value;
            next();
        } catch (error) {
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
                    const { error, value } = schema.validate(req[property], {
                        abortEarly: false,
                        stripUnknown: true,
                        allowUnknown: false
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
