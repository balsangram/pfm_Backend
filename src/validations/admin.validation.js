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
