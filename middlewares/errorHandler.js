const sendResponse = require("../config/response");

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  sendResponse(res, false, null, "Internal Server Error", 500);
};

module.exports = errorHandler;
