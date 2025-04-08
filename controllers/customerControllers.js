const {
  fetchAndStoreCustomers,
  getAllcustomers,
  getCustomerBycode,
  getAccessToken,
  fetchAndStoreCustomersWithRefresh,
  manageCustomerAndProduct,

} = require("../services/customerServices");
const { successResponse, errorResponse } = require("../config/response");

const ZohoCustomers = async (req, res) => {
  try {
    const accessToken = await getAccessToken(); // Get access token dynamically

    if (!accessToken) {
      return res.status(500).json({ error: "Failed to get access token" });
    }

    const result = await fetchAndStoreCustomersWithRefresh(accessToken);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

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
    return successResponse(
      res,
      "Cutomers fetched successfully",
      pagination,
      customers
    );
  } catch (error) {
    return errorResponse(res, "Error fetching Cutomers",500,error);
  }
};

const getCustomerByCode = async (req, res) => {
  try {
    const { customer_code } = req.query;

    const customer = await getCustomerBycode(customer_code);

    if (!customer) {
      return errorResponse(res, "Customer not found", 404);
    }

    return successResponse(res, "Customer fetched successfully", null, customer);
  } catch (error) {
    return errorResponse(res, "Error fetching customer by code" ,500,error);
  }
};

//one product
const ManageCustomerAndProductsone = async(req, res) => {
  try {

    const {customer_code} = req.query;
    const {product_code} = req.body;

    const result = await manageCustomerAndProduct(customer_code,product_code);

    if (result.error) {
      return errorResponse(res, null, result.statusCode, result.error);
    }
    
    return successResponse(res, "Customer Products Managed successfully", null, result);

  } catch (error) {
    return errorResponse(res, "Error Managing customer Products", 500, error);
}
};

//multiple products
const ManageCustomerAndProducts = async(req, res) => {
  try {

    const { customer_code, Product_Codes,userId  } = req.body;

    if (!Array.isArray(Product_Codes) || Product_Codes.length === 0) {
      return errorResponse(res, "Invalid Data Pass", 400, null);
    }

    const result = await manageCustomerAndProduct(customer_code, Product_Codes, userId);

    if (result.success) {
      return successResponse(res, result.message, null, null);
    } else {
      return errorResponse(res, result.ProductCodes, 400, null);
    }

  } catch (error) {
    return errorResponse(res, "Error Managing customer Products", 500, error);
}
};


module.exports = { storeCustomers, getCustomers, getCustomerByCode,  ZohoCustomers, ManageCustomerAndProducts };
