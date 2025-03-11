// const successResponse = (res, message, pagination, data = {}) => {
//   return res.status(200).json({ status: true, message, pagination, data });
// };

const successResponse = (res, message, pagination = null, data = null) => {
  const response = { status: true, message };

  if (pagination) {
    response.pagination = pagination;
  }

  if(data) {
    response.data = data 
  }

  return res.status(200).json(response);
};


// const errorResponse = (res, message = null, statusCode = 500, error = null) => {
//   return res.status(statusCode).json({ status: false, message ,error:error ? error.message : null});
// };

const errorResponse = (res, message = null, statusCode = 500, error = null) => {
  const response = { status: false };
  
  if (message) response.message = message;
  if (error) response.error = error.message;

  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };
