const Joi = require("joi");

const createProduct = Joi.object({
  productName: Joi.string().required().messages({
    "string.empty": "Product name is required",
  }),
  productCode: Joi.string()
    .pattern(/^[A-Za-z]{4}\d{4}$/)
    .required()
    .messages({
      "string.empty": "Product code is required",
      "string.pattern.base": "Product code must have 4 letters followed by 4 digits (e.g., ABCD1234)",
    }),
  productDesc: Joi.string().allow(""),
});

const updateProduct = Joi.object({
    productName: Joi.string().required().messages({
        "string.empty": "Product name is required",
      }),
    productDesc: Joi.string().allow(""),
});

module.exports = { createProduct, updateProduct };
