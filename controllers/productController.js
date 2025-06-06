const { successResponse, errorResponse } = require("../config/response");
const productService = require("../services/productService");

const getProd = async (req, res) => {
  try {
    const filter = { ...req.query };
    const products = await productService.getPro(filter);

    return successResponse(res, "Products fetched successfully", null, products);
  } catch (error) {
    return errorResponse(res, "Error fetching products", 500, error.message);
  }
};

const getProductOLd = async (req, res) => {
  try {
    const { active, search, page = 1, limit = 10 } = req.query;
    let filter = {};

    if (active === "true") {
      filter.isActive = true;
    } else if (active === "false") {
      filter.isActive = false;
    }
    const result = await productService.getAllProducts(
      filter,
      search,
      page,
      limit
    );
    const { products, ...pagination } = result;
    return successResponse(res, "Products fetched successfully", pagination, products);
  } catch (error) {
    return errorResponse(res, "Error fetching products", 500, error);
  }
};

const getProduct = async (req, res) => {
  try {
    const { active, search ,productStatus} = req.query;
    let filter = {};

    if (active === "true") {
      filter.isActive = true;
    } else if (active === "false") {
      filter.isActive = false;
    }

    const result = await productService.getAllProducts(filter, search,productStatus);
    return successResponse(res, "Products fetched successfully", null, result);
  } catch (error) {
    return errorResponse(res, "Error fetching products", 500, error);
  }
};

const AddProduct = async (req, res) => {
  try {
    const {
      productCode,
      resinType,
      adapterSize,
      vesselSize,
      distributorType,
    } = req.body;
    const newProduct = await productService.createProduct({
      productCode,
      resinType,
      adapterSize,
      vesselSize,
      distributorType
    });
    return successResponse(res, "Product created successfully", null, newProduct);
  } catch (error) {
    return errorResponse(
      res,
      error.message.includes("E11000")
        ? "Product code must be unique"
        : error.message,
      400
    );
  }
};

const EditProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productService.updateProduct(id, req.body);

    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, result.data);
  } catch (error) {
    return errorResponse(res, "Error updating product", 500, error);
  }
};

const DeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productNotes = req.body.productNotes; 

    const result = await productService.deleteProduct(id,productNotes);

    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, result.data);
  } catch (error) {
    return errorResponse(res, "Error deleting product", 500, error);
  }
};

const RestoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productService.restoreProduct(id);

    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, result.data);
  } catch (error) {
    return errorResponse(res, "Error restoreing product", 500, error);
  }
};

const addProductToCustomer = async (req, res) => {
  try {
    const { customerId, productId } = req.body;
    if (!customerId || !productId) {
      return errorResponse(res, "Customer ID and Product ID are required", 400);
    }

    const updatedCustomer = await productService.associateProductWithCustomer(
      customerId,
      productId
    );
    return successResponse(
      res,
      "Product associated with customer successfully",
      null,
      updatedCustomer
    );
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

const getCustomerProducts = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customerWithProducts = await productService.getCustomerWithProducts(
      customerId
    );

    if (!customerWithProducts)
      return errorResponse(res, "Customer not found", 404);

    return successResponse(
      res,
      "Customer products retrieved successfully",
      null,
      customerWithProducts
    );
  } catch (error) {
    return errorResponse(res, "Error fetching customer products", 500, error);
  }
};

const getProductByCode = async (req, res) => {
  try {
    const { product_code } = req.query;

    const product = await productService.getProductBycode(product_code);

    if (!product) {
      return errorResponse(res, "product not found", 404);
    }

    return successResponse(res, "product fetched successfully", null, product);
  } catch (error) {
    return errorResponse(res, "Error fetching product by code", 500, error);
  }
};

const uploadProducts = async (req, res) => {
  try {
    const { Products } = req.body;

    if (!Array.isArray(Products) || Products.length === 0) {
      return errorResponse(res, "Invalid Data Pass", 400, null);
    }

    const result = await productService.uploadProducts(Products);

    if(result.duplicateCount === 0)
    {
      return successResponse(res, result.message, null, null);
    }
    else
    {
      // return successResponse(res, `${result.insertedCount} Product Are Added SuccessFully & ${result.duplicateCount} Product Code ${result.duplicateProductCodes} Are Exists`)
      return successResponse(res, result.message,null,null)
    }

  } catch (error) {
    return errorResponse(res, "Error while adding products", 500, error);
  }
};

module.exports = {
  AddProduct,
  DeleteProduct,
  EditProduct,
  RestoreProduct,
  getProduct,
  addProductToCustomer,
  getCustomerProducts,
  getProductByCode,
  uploadProducts,
  getProd
};
