const { fetchAndStoreCustomers,getAllcustomers ,getCustomerBycode } = require("../services/userServices");
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
    const result = await getAllcustomers();
    successResponse(res, "Cutomers fetched successfully", result);
  } catch (error) {
    errorResponse(res, "Error fetching Cutomers");
  }
};

const getCustomerByCode = async (req ,res) => {
  try {
    const {customer_code} = req.query;

    const customer = await getCustomerBycode(customer_code);

    if(!customer) {
      return errorResponse(res, "Customer not found", 404);
    }

    successResponse(res, "Customer fetched successfully", customer);

     
  } catch (error) {
    errorResponse(res, "Error fetching customer by code");
  }
};

module.exports = { storeCustomers ,getCustomers,getCustomerByCode};
