const Joi = require("joi");

const createWareHouse = Joi.object({
    wareHouse_code: Joi.string()
      .pattern(/^\d+\.\d+\.\d+\.[A-Za-z]$/)
      .required()
      .messages({
        "string.empty": "WareHouse code is required",
        "string.pattern.base":"WareHouse code must follow the format: 1054.59.25.W"
      }),
  });

  module.exports = {createWareHouse}
