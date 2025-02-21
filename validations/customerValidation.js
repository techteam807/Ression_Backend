const Joi = require("joi");

const customerSchema = Joi.object({
  customer_name: Joi.string().required().messages({
    "string.empty": "Customer name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "Email is required",
  }),
  phone: Joi.string().pattern(/^\d+$/).messages({
    "string.pattern.base": "Phone number must contain only digits",
  }),
});

module.exports = { customerSchema };
