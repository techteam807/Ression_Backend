const { successResponse, errorResponse } = require("../config/response");
const productService = require("../services/productService");
const getProduct = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        successResponse(res, "Products fetched successfully", products);
      } catch (error) {
        errorResponse(res, "Error fetching products");
      }
 };
const AddProduct = async (req, res) => { 
    try {
        const { productName, productCode, productDesc } = req.body;
        if (!productName || !productCode) {
          return errorResponse(res, "Product name and code are required", 400);
        }
    
        const newProduct = await productService.createProduct({ productName, productCode, productDesc });
        successResponse(res, "Product created successfully", newProduct, 201);
      } catch (error) {
        errorResponse(res, error.message.includes("E11000") ? "Product code must be unique" : error.message, 400);
      }
 };
const EditProduct = async (req, res) => { 
    try {
        const { id } = req.params;
        const updatedProduct = await productService.updateProduct(id, req.body);
        if (!updatedProduct) return errorResponse(res, "Product not found", 404);
        successResponse(res, "Product updated successfully", updatedProduct);
      } catch (error) {
        errorResponse(res, "Error updating product");
      }
 };
const DeleteProduct = async (req, res) => { 
    try {
        const { id } = req.params;
        const deletedProduct = await productService.deleteProduct(id);
        if (!deletedProduct) return errorResponse(res, "Product not found", 404);
        successResponse(res, "Product deleted successfully");
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
  
      const updatedCustomer = await productService.associateProductWithCustomer(customerId, productId);
      successResponse(res, "Product associated with customer successfully", updatedCustomer);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  };

  const getCustomerProducts = async (req, res) => {
    try {
      const { customerId } = req.params;
      const customerWithProducts = await productService.getCustomerWithProducts(customerId);
  
      if (!customerWithProducts) return errorResponse(res, "Customer not found", 404);
  
      successResponse(res, "Customer products retrieved successfully", customerWithProducts);
    } catch (error) {
      errorResponse(res, "Error fetching customer products");
    }
  };
 

 module.exports = {AddProduct,DeleteProduct,EditProduct,getProduct,addProductToCustomer,getCustomerProducts};


