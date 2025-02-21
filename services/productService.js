const Product = require("../models/productModel");
const Customer = require("../models/customerModel");

const getAllProducts = async () => {
  return await Product.find();
};

const getProductById = async (id) => {
  return await Product.findById(id);
};

const createProduct = async (data) => {
  return await Product.create(data);
};

const updateProduct = async (id, data) => {
  return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};

const associateProductWithCustomer = async (customerId, productId) => {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error("Customer not found");
  
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");
  
    if (customer.products.includes(productId)) {
      throw new Error("Product is already associated with this customer");
    }
  
    customer.products.push(productId);
    await customer.save();
    
    return customer;
  };

  const getCustomerWithProducts = async (customerId) => {
    return await Customer.findById(customerId).populate("products");
  };

  const getProductBycode = async (product_code) => {
    return await Product.findOne({productCode:product_code});
  }

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, associateProductWithCustomer,getCustomerWithProducts,getProductBycode };
