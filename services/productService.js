
const Product = require("../models/productModel");
const Customer = require("../models/customerModel");
const { ProductEnum } = require("../config/global");

// const getAllProducts = async (filter ={}) => {
//   return await Product.find(filter);
// };

const getAllProductsold = async (filter = {}, search, page, limit) => {
  if(search) {
    filter.$or = [
      // { productName: new RegExp(search, 'i') },
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

const getAllProducts = async (filter = {}, search) => {

  if(search) {
    filter.$or = [
      { productCode: new RegExp(search, "i")},
      { resinType: new RegExp(search, "i") },
      {  productStatus: new RegExp(search, "i") },
    ];
  }

  // const products = await Product.find(filter);//default order
  const products = await Product.find(filter).sort({ updatedAt: -1 });//desc order

  const newProducts = products.filter((p) => p.productStatus === ProductEnum.NEW);
  const exhaustedProducts = products.filter((p) => p.productStatus === ProductEnum.EXHAUSTED);

  // all fields
  let inuseProducts = products.filter((p) => p.productStatus === ProductEnum.IN_USE);

  const Cutomers = await Customer.find({ products: { $in : inuseProducts.map(p => p._id)}});

  inuseProducts = inuseProducts.map(product => {
    const customersForProduct = Cutomers.filter(cust => cust.products.includes(product._id.toString()));
    return {
      ...product.toObject(),
      customers: customersForProduct,
    };
  });

  // //relevent fields
  //  let inuseProducts = products.filter((p) => p.productStatus === ProductEnum.IN_USE);

  //  const Customers = await Customer.find(
  //    { products: { $in: inuseProducts.map((p) => p._id) } },
  //    "contact_number first_name last_name mobile email display_name products" // Ensure 'products' is included
  //  );
 
  //  inuseProducts = inuseProducts.map((product) => {
  //    const customersForProduct = Customers.filter(
  //      (cust) => Array.isArray(cust.products) && cust.products.includes(product._id.toString()) // Safe check
  //    );
 
  //    return {
  //      ...product.toObject(),
  //      customers: customersForProduct,
  //    };
  //  });
 
  return {
    newProducts,
    exhaustedProducts,
    inuseProducts
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

const restoreProduct = async (id) => {
  return await Product.findByIdAndUpdate(id,{isActive:true},{new:true});
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

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, associateProductWithCustomer, getCustomerWithProducts, getProductBycode, restoreProduct };
