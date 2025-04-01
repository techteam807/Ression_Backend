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

const manageCustomerAndProductOLd = async (customer_code, product_code) => {
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

const manageCustomerAndProductOne = async (customer_code, product_code) => {

  //customer_code
  if(customer_code && product_code)
  {
    const Customer = await getCustomerBycode(customer_code);
    const ProductS = await ProductService.getProductBycode(product_code);

    if (!Customer) {
      return {
        error:  new Error(`Customer not found with ${customer_code}`),
        statusCode: 404,
      };
    }
    else
    {
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
    }

    if(!ProductS)
      {
        return {
          error:  new Error(`Product Not Found With Code : ${product_code}`),
          statusCode: 404,
        };
      }
      else
      {
        if(!ProductS.isActive)
        {
          return {
            error:  new Error(`Product Not Active With Code : ${product_code}`),
            statusCode: 404,
          };
        }
        else if(ProductS.productStatus === ProductEnum.IN_USE)
        {
          return {
            error:  new Error(`Product Status Found In Use With Code : ${product_code}`),
            statusCode: 404,
          };
        } 
        else if(ProductS.productStatus === ProductEnum.EXHAUSTED)
        {
          return {
            error:  new Error(`Product Status Found Exhausted With Code : ${product_code}`),
            statusCode: 404,
          };
        }
        else
        {
          Customer.products.push(ProductS._id);
          await Customer.save();
  
        await Product.findOneAndUpdate(
          { productCode: product_code },
          { productStatus: ProductEnum.IN_USE }
        );
        }
      }

      return {Customer};
  }
};

const manageCustomerAndProduct = async (customer_code, Product_Codes) => {
  let messages = [];
  let success = false;

  const Customers = await getCustomerBycode(customer_code);
  const ProductS = await ProductService.getMultipleProductByCode(Product_Codes);

  if (!Customers) {
    return { success: false, message: `Customer not found with code: ${customer_code}`};
  }

  Customers.products = Customers.products || [];

  // Validate Products
  const foundProductCodes = ProductS.map((p) => p.productCode);
  const missingProductCodes = Product_Codes.filter(
    (code) => !foundProductCodes.includes(code)
  );

  if (missingProductCodes.length > 0) {
    messages.push(
      `Product Not Found With Code : ${missingProductCodes.join(", ")}`
    );
  }

  const DeletedProducts = [];
  const InUseProducts = [];
  const ExhaustedProducts = [];
  const NewProducts = [];

  ProductS.forEach((product) => {
    if (product.isActive) {
      if (product.productStatus === ProductEnum.EXHAUSTED) {
        ExhaustedProducts.push(product);
      } else if (product.productStatus === ProductEnum.IN_USE) {
        InUseProducts.push(product);
      } else if (product.productStatus === ProductEnum.NEW) {
        NewProducts.push(product);
      }
    } else {
      DeletedProducts.push(product);
    }
  });

  // Extract product codes
  const ExhaustedProductCodes = ExhaustedProducts.map((p) => p.productCode);
  const NewProductCodes = NewProducts.map((p) => p.productCode);
  const InUseProductCodes = InUseProducts.map((p) => p.productCode);
  const DeletedProductCodes = DeletedProducts.map((p) => p.productCode);
  const NotFoundProductCodes = missingProductCodes;

  if (ExhaustedProducts.length > 0) {
    messages.push(
      `Product Status Found Exhausted With Codes: ${ExhaustedProductCodes.join(
        ", "
      )}`
    );
  }
  if (InUseProducts.length > 0) {
    messages.push(
      `Product Status Found In Use With Codes : ${InUseProductCodes.join(", ")}`
    );
  }
  if (DeletedProductCodes.length > 0) {
    messages.push(`Product Not Active With Codes : ${DeletedProductCodes.join(", ")}`);
  }

  if (
    NewProducts.length > 0 &&
    ExhaustedProductCodes.length === 0 &&
    InUseProductCodes.length === 0 &&
    DeletedProductCodes.length === 0 &&
    NotFoundProductCodes.length === 0
  ) {
    // Remove existing products from customer and update their status
    if (Customers.products.length > 0) {
      await Product.updateMany(
        { _id: { $in: Customers.products } },
        { productStatus: ProductEnum.EXHAUSTED }
      );
      Customers.products = [];
      await Customers.save();
    }

    // Attach new products and update their status
    Customers.products = NewProducts.map((p) => p._id);
    await Customers.save();

    await Product.updateMany(
      { productCode: { $in: NewProductCodes } },
      { productStatus: ProductEnum.IN_USE }
    );

    messages.push(
      `Product attached to Customer for codes: ${NewProductCodes.join(", ")}`
    );
    success = true;
  }

  return {
    success,
    message: messages,
    ProductCodes: {
      notFound: NotFoundProductCodes.join(", "),
      exhausted: ExhaustedProductCodes.join(", "),
      inUse: InUseProductCodes.join(", "),
      deleted: DeletedProductCodes.join(", "),
    },
    Customer: Customers,
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
