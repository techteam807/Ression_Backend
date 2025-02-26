const { errorResponse } = require("../config/response");

const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.query, ...req.body }, { abortEarly: false });

  if (error) {
    return errorResponse(res, error.details.map((err) => err.message).join(", "), 400);
  }

  next();
};

module.exports = { validateRequest };
