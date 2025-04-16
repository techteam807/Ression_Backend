const Joi = require("joi");
const {ProductEnum} = require('../config/global');

const createProduct = Joi.object({
  productCode: Joi.string()
    .pattern(/^[A-Za-z0-9]{1,5}\.[A-Za-z0-9]{1,5}\.[A-Za-z0-9]{1,5}\.[A-Za-z0-9]+$/)
    .required()
    .messages({
      "string.empty": "Product code is required",
      "string.pattern.base":"Product code format: ABC12.ABC12.ABC12.ABC122.."
    }),
  distributorType:Joi.string().allow(""),
  resinType:Joi.string().allow(""),
  adapterSize:Joi.string().allow(""),
  vesselSize:Joi.string().allow("")
});

const updateProduct = Joi.object({
    id: Joi.string().required(),
    distributorType:Joi.string().allow(""),
    resinType:Joi.string().allow(""),
    adapterSize:Joi.string().allow(""),
    vesselSize:Joi.string().allow("")
});

const deleteProduct = Joi.object({
  id: Joi.number().integer().required(),
})

const restoreProduct = Joi.object({
  id: Joi.number().integer().required(),
})

const getProductByCode = Joi.object({
  product_code: Joi.string().required(),
})

module.exports = { createProduct, updateProduct, deleteProduct, restoreProduct, getProductByCode };
