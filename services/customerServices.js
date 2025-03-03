// const axios = require("axios");
// const Customer = require("../models/usermodel");

// const ZOHO_API_URL = "https://www.zohoapis.in/subscriptions/v1/customers"; // Replace with actual API URL

// const fetchAndStoreCustomers = async (accessToken) => {
//   try {
//     // Fetch customer data from Zoho API
//     const response = await axios.get(ZOHO_API_URL, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });

//     if (!response.data || !response.data.customers) {
//       throw new Error("Invalid response from Zoho API");
//     }

//     const customers = response.data.customers;

//     // Optimize insertion using bulkWrite with upsert
//     const operations = customers.map((customer) => ({
//       updateOne: {
//         filter: { customer_id: customer.customer_id }, // Prevent duplicates
//         update: { $set: customer },
//         upsert: true, // Insert if not exists
//       },
//     }));

//     await Customer.bulkWrite(operations);

//     return { message: "Customers stored successfully", count: customers.length };
//   } catch (error) {
//     console.error("Error in fetchAndStoreCustomers:", error.message);
//     throw error;
//   }
// };

// module.exports = { fetchAndStoreCustomers };
// import { ProductEnum } from '../config/global';
const { ProductEnum } = require("../config/global.js");
const axios = require("axios");
const Customer = require("../models/customerModel");
const Product = require("../models/productModel");

const ProductService = require("../services/productService");

const ZOHO_API_URL = "https://www.zohoapis.in/subscriptions/v1/customers";

const getAccessToken = async () => {
  try {
    const response = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: process.env.REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return response.data.access_token; // Return access token
  } catch (error) {
    console.error(
      "Error getting access token:",
      error.response?.data || error.message
    );
    return null;
  }
};

const fetchAndStoreCustomers1 = async (accessToken) => {
  try {
    const response = await axios.get(ZOHO_API_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.data || !response.data.customers) {
      throw new Error("Invalid response from Zoho API");
    }

    const zohoCustomers = response.data.customers;
    const zohoCustomerIds = zohoCustomers.map((c) => c.customer_id);

    const existingCustomers = await Customer.find(
      { customer_id: { $in: zohoCustomerIds } },
      { customer_id: 1, _id: 0 }
    );

    const existingCustomerIds = new Set(
      existingCustomers.map((c) => c.customer_id)
    );

    const newCustomers = zohoCustomers.filter(
      (c) => !existingCustomerIds.has(c.customer_id)
    );

    if (newCustomers.length > 0) {
      await Customer.insertMany(newCustomers);
      return { message: "New customers added", count: newCustomers.length };
    } else {
      return { message: "No new customers to add", count: 0 };
    }
  } catch (error) {
    console.error("Error in fetchAndStoreCustomers:", error.message);
    throw error;
  }
};

const fetchAndStoreCustomers = async (accessToken) => {
  try {
    const response = await axios.get(ZOHO_API_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.data || !response.data.customers) {
      throw new Error("Invalid response from Zoho API");
    }

    const zohoCustomers = response.data.customers;
    const zohoCustomerIds = zohoCustomers.map((c) => c.customer_id);

    const existingCustomers = await Customer.find(
      { customer_id: { $in: zohoCustomerIds } },
      { customer_id: 1, _id: 0 }
    );

    const existingCustomerIds = new Set(
      existingCustomers.map((c) => c.customer_id)
    );

    // Filter only new customers (not in our DB)
    const newCustomers = zohoCustomers.filter(
      (c) => !existingCustomerIds.has(c.customer_id)
    );

    if (newCustomers.length > 0) {
      // Insert only new customers
      await Customer.insertMany(newCustomers);
      return { message: "New customers added", count: newCustomers.length };
    } else {
      return { message: "No new customers to add", count: 0 };
    }
  } catch (error) {
    console.error("Error in fetchAndStoreCustomers:", error.message);
    throw error;
  }
};

const getAllcustomers = async (search, page, limit) => {
  let filter = search
    ? {
        $or: [
          { customer_name: new RegExp(search, "i") },
          { display_name: new RegExp(search, "i") },
          { company_name: new RegExp(search, "i") },
          { first_name: new RegExp(search, "i") },
          { last_name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { website: new RegExp(search, "i") },
          {contact_number:new RegExp(search, "i")},
        ],
      }
    : {};

  const options = {
    skip: (page - 1) * limit,
    limit: parseInt(limit),
  };

  const customers = await Customer.find(filter)
    .skip(options.skip)
    .limit(options.limit);
  const totalRecords = await Customer.countDocuments(filter);

  return {
    totalData: totalRecords,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalRecords / limit),
    customers,
  };
};

const getCustomerBycode = async (customer_code) => {
  return await Customer.findOne({ contact_number: customer_code }).populate({
    path: "products",
    select: "productCode resinType productStatus",
  });
};

// const replaceCustomersProductsOld = async (customer_code) => {
//   const Customer = await getCustomerBycode(customer_code);

//   if (!Customer) {
//     return { error: "Customer not found", statusCode: 404 };
//   }

//   if (!Customer.products || Customer.products.length === 0) {
//     return { error: "No products found for this customer", statusCode: 404 };
//   }

//   const alreadyExhausted = Customer.products.every(
//     (product) => product.resinType === ProductEnum.EXHAUSTED
//   );

//   if (alreadyExhausted) {
//     return { message: "All products are already exhausted", statusCode: 200 };
//   }

//   const ManageProducts = await Promise.all(
//     Customer.products.map(async (product) => {
//       return await Product.findByIdAndUpdate(
//         product._id,
//         { resinType: ProductEnum.EXHAUSTED },
//         { new: true }
//       );
//     })
//   );

//   return {
//     ManageProducts,
//   };
// };

// const replaceCustomersProductsNew = async (customer_code, newProductId) => {
//   const customer = await getCustomerBycode(customer_code);

//   if (!customer) {
//     return { error: "Customer not found", statusCode: 404 };
//   }

//   if (!customer.products || customer.products.length === 0) {
//     return { error: "No products found for this customer", statusCode: 404 };
//   }

//   const exhaustedProducts = customer.products.filter(
//     (product) => product.resinType === ProductEnum.EXHAUSTED
//   );

//   const exhaustedProductIds = exhaustedProducts.map((product) => product._id);

//   customer.products = customer.products.filter(
//     (product) => product.resinType !== ProductEnum.EXHAUSTED
//   );

//   await customer.save();

//   const newProduct = await Product.findById(newProductId);
//   if (!newProduct) {
//     return { error: "New product not found", statusCode: 404 };
//   }

//   const productAlreadyExists = customer.products.some(
//     (product) => product._id.toString() === newProductId.toString()
//   );

//   if (productAlreadyExists) {
//     return {
//       message: "Product already assigned to the customer",
//       statusCode: 200,
//     };
//   }

//   customer.products.push(newProductId);
//   await customer.save();

//   await Product.updateMany(
//     { _id: { $in: exhaustedProductIds } },
//     { resinType: ProductEnum.EXHAUSTED }
//   );

//   await Product.findByIdAndUpdate(newProductId, {
//     resinType: ProductEnum.IN_USE,
//   });

//   return {
//     customer,
//   };
// };

const manageCustomerAndProduct = async (customer_code, product_code) => {
  const Customer = await getCustomerBycode(customer_code);

  if (!Customer) {
    return {
      error:  new Error(`Customer not found with ${customer_code}`),
      statusCode: 404,
    };
  }

  Customer.products = Customer.products || [];

  const CustomerproductIds = Customer.products.map((product) => product._id);

  if (CustomerproductIds.length > 0) {
    await Product.updateMany(
      { _id: { $in: CustomerproductIds } },
      { productStatus: ProductEnum.EXHAUSTED }
    );
    Customer.products = [];
    await Customer.save();
  }

  if (product_code) {
    const Products = await ProductService.getProductBycode(product_code);
    console.log(Products);

    if (!Products) {
      return {
        error:  new Error(`Product not found with ${product_code}`),
        statusCode: 404,
      };
    }
    
    if(!Products.isActive)
    {
      return {
        error:  new Error(`Product not Active ${product_code}`),
        statusCode: 404,
      };
    }

    Customer.products.push(Products._id);

    await Customer.save();

    await Product.findOneAndUpdate(
      { productCode: product_code },
      { productStatus: ProductEnum.IN_USE }
    );
  }

  return {
    Customer,
  };
};

module.exports = {
  getAccessToken,
  fetchAndStoreCustomers1,
  fetchAndStoreCustomers,
  getAllcustomers,
  getCustomerBycode,
  // replaceCustomersProductsOld,
  // replaceCustomersProductsNew,
  manageCustomerAndProduct,
};
