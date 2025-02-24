const {
  fetchAndStoreCustomers,
  getAllcustomers,
  getCustomerBycode,
  replaceCustomersProducts,
  replaceCustomersProducts1
} = require("../services/customerServices");
const { successResponse, errorResponse } = require("../config/response");

const storeCustomers = async (req, res) => {
  try {
    const { accessToken } = req.body; // Send accessToken in request body

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    const result = await fetchAndStoreCustomers(accessToken);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const result = await getAllcustomers(search, page, limit);
    const { customers, ...pagination } = result;
    successResponse(
      res,
      "Cutomers fetched successfully",
      pagination,
      customers
    );
  } catch (error) {
    errorResponse(res, "Error fetching Cutomers");
  }
};

const getCustomerByCode = async (req, res) => {
  try {
    const { customer_code } = req.query;

    const customer = await getCustomerBycode(customer_code);

    if (!customer) {
      return errorResponse(res, "Customer not found", 404);
    }

    successResponse(res, "Customer fetched successfully", null, customer);
  } catch (error) {
    errorResponse(res, "Error fetching customer by code");
  }
};

const ReplaceProducts = async (req, res) => {
  try {

    const {customer_code} = req.query;

    if (!newProductId) {
      return errorResponse(res, "New product ID is required", 400);
    }

    const result = await replaceCustomersProducts(customer_code);

    if (result.error) {
      return errorResponse(res, result.error, result.statusCode);
    }

    successResponse(res, "Customer Products Managed successfully", null, result);
  } catch (error) {
    errorResponse(res, "Error Managing customer Products");
  }
};

const ReplaceProducts1 = async (req, res) => {
  try {

    const {customer_code} = req.query;
    const { newProductId } = req.body;

    if (!newProductId) {
      return errorResponse(res, "New product ID is required", 400);
    }

    const result = await replaceCustomersProducts1(customer_code,newProductId);

    if (result.error) {
      return errorResponse(res, result.error, result.statusCode);
    }

    successResponse(res, "Customer Products Managed successfully", null, result);
  } catch (error) {
    errorResponse(res, "Error Managing customer Products");
  }
};

module.exports = { storeCustomers, getCustomers, getCustomerByCode, ReplaceProducts };
