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
    errorResponse(res, "Error fetching products");
  }
};

const AddProduct = async (req, res) => {
  try {
    const { productName, productCode, productDesc, connectorType, distributorType, size, resinType  } = req.body;
    const newProduct = await productService.createProduct({
      productName,
      productCode,
      productDesc,
      connectorType,
      distributorType,
      size,
      resinType
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
    errorResponse(res, "Error updating product");
  }
};

const DeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await productService.deleteProduct(id);
    if (!deletedProduct) return errorResponse(res, "Product not found", 404);
    successResponse(res, "Product deleted successfully", null, deletedProduct);
  } catch (error) {
    errorResponse(res, "Error deleting product");
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
    successResponse(
      res,
      "Product associated with customer successfully",
      null,
      updatedCustomer
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
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
    errorResponse(res, "Error fetching customer products");
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
    errorResponse(res, "Error fetching product by code");
  }
};

module.exports = {
  AddProduct,
  DeleteProduct,
  EditProduct,
  getProduct,
  addProductToCustomer,
  getCustomerProducts,
  getProductByCode,
};
