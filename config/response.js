const successResponse = (res, message, pagination, data = {}) => {
  return res.status(200).json({ status: true, message, pagination, data });
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ status: false, message });
};

module.exports = { successResponse, errorResponse };
