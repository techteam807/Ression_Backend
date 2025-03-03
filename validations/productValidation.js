const Joi = require("joi");
const {ProductEnum} = require('../config/global');

const createProduct = Joi.object({
  // productName: Joi.string().required().messages({
  //   "string.empty": "Product name is required",
  // }),
  productCode: Joi.string()
    .pattern(/^[A-Za-z]{4}\d{4}$/)
    .required()
    .messages({
      "string.empty": "Product code is required",
      "string.pattern.base": "Product code must have 4 letters followed by 4 digits (e.g., ABCD1234)",
    }),
  // productDesc: Joi.string().allow(""),
  connectorType:Joi.string().allow(""),
  distributorType:Joi.string().allow(""),
  size:Joi.string().allow(""),
  resinType:Joi.string().valid(ProductEnum.NEW,ProductEnum.IN_USE,ProductEnum.EXHAUSTED).required().messages({
    "any.only": 'Resin type must be one of "new", "exhausted", or "inuse"',
    "string.empty": "Resin type is required",
  }),
  productStatus:Joi.string().valid(ProductEnum.NEW,ProductEnum.IN_USE,ProductEnum.EXHAUSTED).required().messages({
    "any.only": 'Resin type must be one of "new", "exhausted", or "inuse"',
    "string.empty": "Resin type is required",
  }),
});

const updateProduct = Joi.object({
    // productName: Joi.string().required().messages({
    //     "string.empty": "Product name is required",
    //   }), 
    // productDesc: Joi.string().allow(""),
    id: Joi.string().required(),
    connectorType:Joi.string().allow(""),
    distributorType:Joi.string().allow(""),
    size:Joi.string().allow(""),
    resinType:Joi.string().valid(ProductEnum.NEW,ProductEnum.IN_USE,ProductEnum.EXHAUSTED).required().messages({
    "any.only": 'Resin type must be one of "new", "exhausted", or "inuse"',
    "string.empty": "Resin type is required",
  }),
  productStatus:Joi.string().valid(ProductEnum.NEW,ProductEnum.IN_USE,ProductEnum.EXHAUSTED).required().messages({
    "any.only": 'Resin type must be one of "new", "exhausted", or "inuse"',
    "string.empty": "Resin type is required",
  }),
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
