const Joi = require("joi");

// const addCustomer = Joi.object({
//   customer_name: Joi.string().required().messages({
//     "string.empty": "Customer name is required",
//   }),
//   email: Joi.string().email().required().messages({
//     "string.email": "Invalid email format",
//     "string.empty": "Email is required",
//   }),
//   phone: Joi.string().pattern(/^\d+$/).messages({
//     "string.pattern.base": "Phone number must contain only digits",
//   }),
// });

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
