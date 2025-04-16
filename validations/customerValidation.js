const Joi = require("joi");

const getCustomerByCode = Joi.object({
  customer_code: Joi.string().required(),
});

const manageProductsOld = Joi.object({
  customer_code: Joi.string().required(),
});

const manageProductsNew = Joi.object({
  customer_code: Joi.string().required(),
  newProductId: Joi.string().required(),
})

module.exports = { getCustomerByCode,manageProductsOld, manageProductsNew };
