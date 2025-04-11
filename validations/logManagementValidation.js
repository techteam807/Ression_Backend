const Joi = require("joi");
const mongoose = require("mongoose");
const { ProductEnum } = require("../config/global");


const makeValidationMiddleware = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        if (error) {
            return res.status(400).json({
                error: error.details.map(detail => detail.message).join(", ")
            });
        }
        next();
    };
};


const isValidObjectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message(`Invalid ObjectId: ${value}`);
    }
    return value;
};


const createLogJoiSchema = Joi.object({
    customerId: Joi.string().custom(isValidObjectId, 'ObjectId validation').optional(),
    products: Joi.array().items(Joi.string().custom(isValidObjectId, 'ObjectId validation')).min(1).optional(),
    userId: Joi.string().custom(isValidObjectId, 'ObjectId validation').optional(),
    status: Joi.string().valid(...Object.values(ProductEnum)).optional(),
});


const getAllLogsJoiSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    productId: Joi.string().custom(isValidObjectId, 'ObjectId validation'),
    userId: Joi.string().custom(isValidObjectId, 'ObjectId validation'),
    customerId: Joi.string().custom(isValidObjectId, 'ObjectId validation'),
    status: Joi.string().valid(...Object.values(ProductEnum)).optional(),
}).custom((value, helpers) => {
        if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
            return helpers.message("startDate must be less than or equal to endDate");
        }
        return value;
    }, "Date range validation");

const getProductJoiSchema = Joi.object({
    productId: Joi.string().custom(isValidObjectId, 'ObjectId validation').required(),
//     page: Joi.number().integer().min(1).default(1),
//     limit: Joi.number().integer().min(1).default(10),
//     startDate: Joi.date().iso().optional(),
//     endDate: Joi.date().iso().optional(),
// }).custom((value, helpers) => {
//         if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
//             return helpers.message("startDate must be less than or equal to endDate");
//         }
//         return value;
//     }, "Date range validation");
});

const getCustomerJoiSchema = Joi.object({
    customerId: Joi.string().custom(isValidObjectId, 'ObjectId validation').required(),
});

const getUserJoiSchema = Joi.object({
    userId: Joi.string().custom(isValidObjectId, 'ObjectId validation').required(),
});


module.exports = {
    createLogSchema: makeValidationMiddleware(createLogJoiSchema, 'body'),
    getAllLogsSchema: makeValidationMiddleware(getAllLogsJoiSchema, 'query'),
    getProduct: makeValidationMiddleware(getProductJoiSchema, 'params'),
    getCustomer: makeValidationMiddleware(getCustomerJoiSchema, 'params'),
    getUser: makeValidationMiddleware(getUserJoiSchema, 'params')
};
