const Product = require("../models/productModel");
const Customer = require("../models/customerModel");

// const getAllProducts = async (filter ={}) => {
//   return await Product.find(filter);
// };

const getAllProducts = async (filter = {}, search, page, limit) => {
  if(search) {
    filter.$or = [
      { productName: new RegExp(search, 'i') },
      { productCode:new RegExp(search, 'i')},
      { resinType:new RegExp(search, 'i')}
    ];
  }

  const options = {
    skip:(page -1) * limit,
    limit:parseInt(limit)
  }

  const products = await Product.find(filter).skip(options.skip).limit(options.limit);
  const totalRecords = await Product.countDocuments(filter);

  return {
    totalData:totalRecords,
    currentPage:parseInt(page),
    totalPages:Math.ceil(totalRecords/ limit),
    products,
  };
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
  return await Product.findByIdAndUpdate(id,{isActive:false},{new:true});
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
