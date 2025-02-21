// const successResponse = (res, message, pagination, data = {}) => {
//   return res.status(200).json({ status: true, message, pagination, data });
// };

const successResponse = (res, message, pagination = null, data = {}) => {
  const response = { status: true, message };

  if (pagination) {
    response.pagination = pagination;
  }

  response.data = data;

  return res.status(200).json(response);
};


const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ status: false, message });
};

module.exports = { successResponse, errorResponse };
