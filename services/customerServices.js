const { ProductEnum } = require("../config/global.js");
const axios = require("axios");
const Customer = require("../models/customerModel");
const Product = require("../models/productModel");
const Log = require("../services/logManagementService.js");
const ProductService = require("../services/productService");
const request = require("request");

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

//refresh customer
const fetchAndStoreCustomersWithRefreshOld = async (accessToken) => {
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

const fetchAndStoreCustomersWithRefresh = async (accessToken) => {
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
      { customer_id: { $in: zohoCustomerIds } }
    );

    const existingCustomerMap = new Map(
      existingCustomers.map((c) => [c.customer_id, c.toObject()])
    );

    const newCustomers = [];
    const updates = [];

    const fieldsToCompare = [
      "display_name",
      "first_name",
      "last_name",
      "email",
      "phone",
      "mobile",
      "contact_number",
      "customer_name",
    ];

    for (const zohoCustomer of zohoCustomers) {
      const existing = existingCustomerMap.get(zohoCustomer.customer_id);

      if (!existing) {
        newCustomers.push(zohoCustomer);
      } else {
        let hasChanges = false;

        for (const field of fieldsToCompare) {
          const newValue = zohoCustomer[field] ?? null;
          const oldValue = existing[field] ?? null;

          if (newValue !== oldValue) {
            hasChanges = true;
            break;
          }
        }

        if (hasChanges) {
          updates.push({
            updateOne: {
              filter: { customer_id: zohoCustomer.customer_id },
              update: { $set: zohoCustomer },
            },
          });
        }
      }
    }

    if (newCustomers.length > 0) {
      await Customer.insertMany(newCustomers);
    }

    if (updates.length > 0) {
      await Customer.bulkWrite(updates);
    }

    return {
      message: "Sync complete",
      added: newCustomers.length,
      updated: updates.length,
    };
  } catch (error) {
    console.error("Error in fetchAndStoreCustomers:", error.message);
    throw error;
  }
};

//store with token
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
  // .select("_id display_name contact_number")
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

const getCustomerBycodeOld = async (customer_code) => {
  return await Customer.findOne({ contact_number: customer_code }).populate({
    path: "products",
    select: "productCode resinType productStatus",
  });
};

const getCustomerBycode = async (customer_code) => {
  const customer = await Customer.findOne({ contact_number: customer_code }).populate({
    path: "products",
    select: "productCode resinType productStatus",
  });

  if (!customer) return null;

  // Extract cartridgeNum from cf_cartridge_size
  const extractThirdNumber = (size) => {
    const matches = size?.match(/\d+/g); // Extract all numbers from the string
    return matches && matches.length >= 3 ? parseInt(matches[2], 10) : 1; // Get third number
  };

  const customerData = customer.toObject();
  
  // Add cartridgeNum to the response
  customerData.cartridgeNum = extractThirdNumber(customerData.cf_cartridge_size);

  return customerData;
};

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

const manageCustomerAndProduct = async (customer_code, Product_Codes, userId) => {
  let messages = [];
  let success = false;

  const Customers = await Customer.findOne({contact_number:customer_code});
  const ProductS = await ProductService.getMultipleProductByCode(Product_Codes);

  if (!Customers) {
    return { success: false, message: `Customer not found with code: ${customer_code}`};
  }

  if (!userId) {
    return { success: false, message: `userId required`};
  }

  const customerEXHAUSTEDId = Customers.products;
  const rawMobile = Customers.mobile;
  const cutomerMobileNumber = rawMobile.replace(/\D/g, '').slice(-10);
  const customerName = Customers.display_name;
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

  const ProductIds = ProductS.map((p) => p.id);
  console.log("p:",ProductIds)

  const CustomerId = Customers.id;
  console.log("c",CustomerId);
  
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

      const genrateLogForEXHAUSTED = {
        customerId:CustomerId,
        products:customerEXHAUSTEDId,
        userId:userId,
        status:ProductEnum.EXHAUSTED,
      }
      await Log.createLog(genrateLogForEXHAUSTED)
    }

    // Attach new products and update their status
    Customers.products = NewProducts.map((p) => p._id);
    await Customers.save();

    await Product.updateMany(
      { productCode: { $in: NewProductCodes } },
      { productStatus: ProductEnum.IN_USE }
    );

    const genrateLogForIN_USE = {
      customerId:CustomerId,
      products:NewProducts.map((p) => p.id),
      userId:userId,
      status:ProductEnum.IN_USE,
    }

    await Log.createLog(genrateLogForIN_USE)
    await sendWhatsAppMsg(cutomerMobileNumber,customerName)

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

const sendWhatsAppMsg = async (mobile_number, name) => {
  console.log(mobile_number,name);
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: process.env.GALLABOX_URL,
      headers: {
        apisecret: process.env.GALLABOX_API_SECRET, // lowercase
        apikey: process.env.GALLABOX_API_KEY, // lowercase
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: process.env.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: mobile_number,
          phone: `91${mobile_number}`,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: "bw_scan_app_utility2",
            bodyValues: { name: name }, // Change from object to array
          },
        },
      }),
    };

    request(options, (error, response) => {
      if (error) {
        console.error("Error sending WhatsApp Msg:", error);
        return reject({ success: false, message: "Failed to send Msg via WhatsApp." });
      }
      console.log("WhatsApp Message Sent:", response.body);
      resolve({ success: true, message: "Msg sent successfully." });
    });
  });
};

module.exports = {
  getAccessToken,
  fetchAndStoreCustomersWithRefresh,
  fetchAndStoreCustomers,
  getAllcustomers,
  getCustomerBycode,
  // replaceCustomersProductsOld,
  // replaceCustomersProductsNew,
  manageCustomerAndProduct,
};
