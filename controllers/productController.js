const { successResponse, errorResponse } = require("../config/response");
const productService = require("../services/productService");

const getProduct = async (req, res) => {
  try {
    const { active, search, page = 1, limit = 10 } = req.query;
    let filter = {};

    if (active === "true") {
      filter.isActive = true;
    } else if (active === "false") {
      filter.isActive = false;
    }
    const result = await productService.getAllProducts(filter, search, page, limit);
    const {products, ...pagination} = result
    successResponse(res, "Products fetched successfully", pagination, products);
  } catch (error) {
    errorResponse(res, "Error fetching products",500,error);
  }
};

const AddProduct = async (req, res) => {
  try {
    const { productCode, connectorType, distributorType, size, resinType, productStatus } = req.body;
    const newProduct = await productService.createProduct({
      productCode,
      connectorType,
      distributorType,
      size,
      resinType,
      productStatus
    });
    successResponse(res, "Product created successfully", null, newProduct);
  } catch (error) {
    errorResponse(
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
    const updatedProduct = await productService.updateProduct(id, req.body);
    if (!updatedProduct) return errorResponse(res, "Product not found", 404);
    successResponse(res, "Product updated successfully", null, updatedProduct);
  } catch (error) {
    errorResponse(res, "Error updating product",500,error);
  }
};

const DeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await productService.deleteProduct(id);
    if (!deletedProduct) return errorResponse(res, "Product not found", 404);
    successResponse(res, "Product deleted successfully", null, deletedProduct);
  } catch (error) {
    errorResponse(res, "Error deleting product",500,error);
  }
};

const RestoreProduct = async (req,res) => {
  try {
    const { id } = req.params;
    const restoreProduct = await productService.restoreProduct(id);
    if(!restoreProduct) return errorResponse(res, "Product not found", 404);
    successResponse(res, "Product restored successfully", null, restoreProduct);
  } catch (error) {
    errorResponse(res, "Error restoreing product",500,error);
  }
}

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
    successResponse(
      res,
      "Product associated with customer successfully",
      null,
      updatedCustomer
    );
  } catch (error) {
    errorResponse(res, error.message,500,error);
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

    successResponse(
      res,
      "Customer products retrieved successfully",
      null,
      customerWithProducts
    );
  } catch (error) {
    errorResponse(res, "Error fetching customer products",500,error);
  }
};

const getProductByCode = async (req, res) => {
  try {
    const { product_code } = req.query;

    const product = await productService.getProductBycode(product_code);

    if (!product) {
      return errorResponse(res, "product not found", 404);
    }

    successResponse(res, "product fetched successfully", null, product);
  } catch (error) {
    errorResponse(res, "Error fetching product by code",500,error);
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
};
