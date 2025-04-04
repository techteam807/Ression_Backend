const Joi = require("joi");
const mongoose = require("mongoose");
const { ProductEnum } = require("../config/global");

const isValidObjectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message(`Invalid ObjectId: ${value}`);
    }
    return value;
};

const logValidationSchema = Joi.object({
    customerId: Joi.string().custom(isValidObjectId).optional(),
    products: Joi.array().items(Joi.string().custom(isValidObjectId)).min(1).optional(),
    userId: Joi.string().custom(isValidObjectId).optional(),
    status: Joi.string()
        .valid(...Object.values(ProductEnum))
        .optional(),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
});

const validateLog = (req, res, next) => {
    const { error } = logValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ error: error.details.map((err) => err.message) });
    }
    next();
};

const validatePagination = (req, res, next) => {
    const { error } = paginationSchema.validate(req.query, { abortEarly: false });
    if (error) {
        return res.status(400).json({ error: error.details.map((err) => err.message) });
    }
    next();
};

module.exports = { validateLog, validatePagination };
