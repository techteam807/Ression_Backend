const Joi = require("joi");

const createWareHouse = Joi.object({
    wareHouse_code: Joi.string()
      .pattern(/^[A-Za-z]{2}-[A-Za-z]{4}-\d+$/) 
      .required()
      .messages({
        "string.empty": "Warehouse code is required",
        "string.pattern.base":"Warehouse code format: AB-ABCD-01"
      }),
  });

  module.exports = {createWareHouse}
