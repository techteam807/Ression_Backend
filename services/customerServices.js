const { ProductEnum } = require("../config/global.js");
const axios = require("axios");
const Customer = require("../models/customerModel");
const cluster_Assignment = require("../models/ClusterAssignmentModel.js");
const Cluster = require("../models/clusterModel.js");
const User = require('../models/userModel.js');
const Product = require("../models/productModel");
const Log = require("../services/logManagementService.js");
const Report = require('../services/waterReportsService.js');
const ProductService = require("../services/productService");
const request = require("request");
const geoLocation = require("../services/geoLocationServices.js");
const puppeteer = require('puppeteer');
const MissedCartidge = require('../models/missedCartidgeModel.js');
const kmeans = require('ml-kmeans').default;
const { sendMissedCatridgeMsg, sendWhatsAppMsg, sendFirstTimeMsg } = require('../services/whatsappMsgServices.js');
const { default: mongoose } = require("mongoose");
const { addCustomerToAssignment } = require("./clusterAssignmentService.js");

const ZOHO_API_URL = "https://www.zohoapis.in/subscriptions/v1/customers";
const ZOHO_API_URL_SUB = "https://www.zohoapis.in/billing/v1/subscriptions";


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

    const subscriptionsResponse  = await axios.get(ZOHO_API_URL_SUB,{
      headers: { Authorization: `Bearer ${accessToken}`},
    });

    const subscriptions = subscriptionsResponse.data.subscriptions || [];

     const subscribedCustomerIds = subscriptions.map(sub => sub.customer_id);

    const subscriptionStatuses = subscriptions.map(sub => ({
      customer_id: sub.customer_id,
      status: sub.status
    }));
    

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
      "cf_cartridge_qty",
      "cf_google_map_link"
    ];


    for (const zohoCustomer of zohoCustomers) {
      const existing = existingCustomerMap.get(zohoCustomer.customer_id);

      if (!existing) {

        // if (zohoCustomer.cf_google_map_link) {
        //   const coords = await getCoordinatesFromShortLink(zohoCustomer.cf_google_map_link);
        //   if (coords) {
        //     zohoCustomer.geoCoordinates = {
        //       type: 'Point',
        //       coordinates: [coords.lng, coords.lat]
        //     };
        //   }
        // }
        // console.log("GeoCoordinates to insert:", zohoCustomer.geoCoordinates); 

        const newCustomer = new Customer({
          ...zohoCustomer,
          geoCoordinates: zohoCustomer.geoCoordinates || undefined,
          isSubscription: subscribedCustomerIds.includes(zohoCustomer.customer_id), // manually add geoCoordinates
        });
        newCustomers.push(newCustomer);
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
const isSubscriptionNow = subscribedCustomerIds.includes(zohoCustomer.customer_id);
        if (existing.isSubscription !== isSubscriptionNow) {
          hasChanges = true;
        }
        if (hasChanges) {
          // if (zohoCustomer.cf_google_map_link) {
          //   const coords = await getCoordinatesFromShortLink(zohoCustomer.cf_google_map_link);
          //   if (coords) {
          //     zohoCustomer.geoCoordinates = {
          //       type: 'Point',
          //       coordinates: [coords.lng, coords.lat]
          //     };
          //   }
          // }

          // // console.log("GeoCoordinates to insert (new):", zohoCustomer.geoCoordinates);
          // console.log("GeoCoordinates to insert:", zohoCustomer.geoCoordinates); 

          updates.push({
            updateOne: {
              filter: { customer_id: zohoCustomer.customer_id },
              update: {
                $set:
                  { ...zohoCustomer, geoCoordinates: zohoCustomer.geoCoordinates || undefined, isSubscription: isSubscriptionNow },
              }
            },
          });
        }
      }
    }

    // console.log("GeoCoordinates to insert:", zohoCustomer.geoCoordinates);

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
      // subscriptionStatuses,
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

const getAllcustomers = async (search, page, limit, isSubscription) => {
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
        { contact_number: new RegExp(search, "i") },
      ],
    }
    : {};

  if (isSubscription === "true") {
    filter.isSubscription = true;
  } else if (isSubscription === "false") {
    filter.isSubscription = false;
  }


  const options = {
    skip: (page - 1) * limit,
    limit: parseInt(limit),
  };

  const customers = await Customer.find(filter).populate("products", "productCode productStatus")
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
    select: "productCode resinType productStatus geoCoordinates",
  });

  if (!customer) return null;

  const customerData = customer.toObject();

  customerData.cartridgeNum = Number(customerData.cf_cartridge_qty);

  return customerData;
};

const manageCustomerAndProductOLd = async (customer_code, product_code) => {
  const Customer = await getCustomerBycode(customer_code);

  if (!Customer) {
    return {
      error: new Error(`Customer not found with ${customer_code}`),
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
        error: new Error(`Product not found with ${product_code}`),
        statusCode: 404,
      };
    }

    if (!Products.isActive) {
      return {
        error: new Error(`Product not Active ${product_code}`),
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
  if (customer_code && product_code) {
    const Customer = await getCustomerBycode(customer_code);
    const ProductS = await ProductService.getProductBycode(product_code);

    if (!Customer) {
      return {
        error: new Error(`Customer not found with ${customer_code}`),
        statusCode: 404,
      };
    }
    else {
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

    if (!ProductS) {
      return {
        error: new Error(`Product Not Found With Code : ${product_code}`),
        statusCode: 404,
      };
    }
    else {
      if (!ProductS.isActive) {
        return {
          error: new Error(`Product Not Active With Code : ${product_code}`),
          statusCode: 404,
        };
      }
      else if (ProductS.productStatus === ProductEnum.IN_USE) {
        return {
          error: new Error(`Product Status Found In Use With Code : ${product_code}`),
          statusCode: 404,
        };
      }
      else if (ProductS.productStatus === ProductEnum.EXHAUSTED) {
        return {
          error: new Error(`Product Status Found Exhausted With Code : ${product_code}`),
          statusCode: 404,
        };
      }
      else {
        Customer.products.push(ProductS._id);
        await Customer.save();

        await Product.findOneAndUpdate(
          { productCode: product_code },
          { productStatus: ProductEnum.IN_USE }
        );
      }
    }

    return { Customer };
  }
};

const manageCustomerAndProducto = async (customer_code, Product_Codes, userId, geoCoordinates, url, score, assignmentId) => {
  
  let messages = [];
  let success = false;
  let errorMessages = [];

  const Customers = await Customer.findOne({ contact_number: customer_code });
  const ProductS = await ProductService.getMultipleProductByCode(Product_Codes);
  const Users = await User.findById(userId);


  if (!Customers) {
    errorMessages.push(`Customer not found with code: ${customer_code}`);
  }

  if (!Users) {
    errorMessages.push(`User not found with id:${userId}`);
  }

  if (errorMessages.length > 0) {
    return {
      success: false,
      errorMessage: { errorMessages },
    };
  }

  const customerEXHAUSTEDId = Customers.products;
  console.log(customerEXHAUSTEDId)
  const rawMobile = Customers.mobile;
  const customerMobileNumber = rawMobile.replace(/\D/g, '').slice(-10);
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
  console.log("p:", ProductIds)

  const CustomerId = Customers.id;
  console.log("c", CustomerId);

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
        {
          $set: { productStatus: ProductEnum.EXHAUSTED },
        }
      );
      Customers.products = [];

      await Customers.save();

      const genrateLogForEXHAUSTED = {
        customerId: CustomerId,
        products: customerEXHAUSTEDId,
        userId: userId,
        status: ProductEnum.EXHAUSTED,
      }

      await Log.createLog(genrateLogForEXHAUSTED)
    }

    // Attach new products and update their status
    Customers.products = NewProducts.map((p) => p._id);
    await Customers.save();

    await Product.updateMany(
      { productCode: { $in: NewProductCodes } },
      {
        $set: {
          productStatus: ProductEnum.IN_USE,
        }
      }
    );

    const genrateLogForIN_USE = {
      customerId: CustomerId,
      products: NewProducts.map((p) => p.id),
      userId: userId,
      status: ProductEnum.IN_USE,
    };

    await geoLocation.storeGeoLocation(CustomerId, geoCoordinates);
    await Log.createLog(genrateLogForIN_USE);

    if (score) {
      const generateReports = {
        customerId: CustomerId,
        waterScore: score,
        date: new Date() 
      };
    await Report.createReports(generateReports);
  };

  if(assignmentId)
  {
    await addCustomerToAssignment(assignmentId, CustomerId);
  }

  if (!Customers.isNew) {
    await sendFirstTimeMsg(customerMobileNumber, customerName);
    Customers.isNew = true;
    await Customers.save();
  }
  else {
    await sendWhatsAppMsg(customerMobileNumber, customerName);
  }

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

const manageCustomerAndProduct = async (customer_code, Product_Codes, userId, geoCoordinates, url, score, assignmentId) => {
  
   const session = await mongoose.startSession();
  session.startTransaction();

  try {
  let messages = [];
  let success = false;
  let errorMessages = [];

  const Customers = await Customer.findOne({ contact_number: customer_code });
  const ProductS = await ProductService.getMultipleProductByCode(Product_Codes);
  const Users = await User.findById(userId);
  const clusterAssignment = await cluster_Assignment.findById(assignmentId);


  if (!Customers) {
    errorMessages.push(`Customer not found with code: ${customer_code}`);
  }

  if (!Users) {
    errorMessages.push(`User not found with id:${userId}`);
  }

  if(!clusterAssignment)
  {
    errorMessages.push(`clusterAssignment not found with id:${assignmentId}`);
  }

  if (errorMessages.length > 0) {
    await session.abortTransaction();
    session.endSession();
    return {
      success: false,
      errorMessage: { errorMessages },
    };
  }

  const customerEXHAUSTEDId = Customers.products;
  console.log(customerEXHAUSTEDId)
  const rawMobile = Customers.mobile;
  const customerMobileNumber = rawMobile.replace(/\D/g, '').slice(-10);
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
  console.log("p:", ProductIds)

  const CustomerId = Customers.id;
  console.log("c", CustomerId);

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
        {
          $set: { productStatus: ProductEnum.EXHAUSTED },
        },
        { session }
      );
      Customers.products = [];
      await Customers.save({ session });

      const genrateLogForEXHAUSTED = {
        customerId: CustomerId,
        products: customerEXHAUSTEDId,
        userId: userId,
        status: ProductEnum.EXHAUSTED,
      }

      await Log.createLog(genrateLogForEXHAUSTED,session)
    }

    // Attach new products and update their status
    Customers.products = NewProducts.map((p) => p._id);
    await Customers.save({ session });

    await Product.updateMany(
      { productCode: { $in: NewProductCodes } },
      {
        $set: {
          productStatus: ProductEnum.IN_USE,
        }
      },
      { session }
    );

    const genrateLogForIN_USE = {
      customerId: CustomerId,
      products: NewProducts.map((p) => p.id),
      userId: userId,
      status: ProductEnum.IN_USE,
    };

    await geoLocation.storeGeoLocation(CustomerId, geoCoordinates, session);
    await Log.createLog(genrateLogForIN_USE,session);

    if (score) {
      const generateReports = {
        customerId: CustomerId,
        waterScore: score,
        date: new Date() 
      };
    await Report.createReports(generateReports,session);
  };

  if(assignmentId)
  {
    await addCustomerToAssignment(assignmentId, CustomerId,session);
  }

  if (!Customers.isNew) {
    await sendFirstTimeMsg(customerMobileNumber, customerName);
    Customers.isNew = true;
    await Customers.save({ session });
  }
  else {
    await sendWhatsAppMsg(customerMobileNumber, customerName);
  }

  messages.push(
    `Product attached to Customer for codes: ${NewProductCodes.join(", ")}`
  );
  success = true;
}

  await session.commitTransaction();
    session.endSession();

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

  }
  catch (error)
  {
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction failed:", error);
    return {
      success: false,
      errorMessage: { error: error.message },
    };
  }
};


const getCustomerDropdown = async (filter) => {
  try {
    return await Customer.find(filter)
      .select("_id display_name contact_number").lean();

  } catch (error) {
    throw new Error("Error in getCustomerDropdown:", error.message);
  }
};

const getCustomerlocations = async (filter) => {
  try {
    return await Customer.find(filter)
      .select("_id display_name contact_number geoCoordinates").lean();

  } catch (error) {
    throw new Error("Error in getCustomerDropdown:", error.message);
  }
};




const getCoordinatesFromShortLink = async (shortUrl) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    if (shortUrl && shortUrl.startsWith("https://maps.app.goo.gl")) {
      await page.goto(shortUrl, { waitUntil: 'networkidle2' });

      const currentUrl = page.url();
      // console.log("Resolved URL:", currentUrl);

      // Regex to extract coordinates from the URL
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = currentUrl.match(regex);

      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        // Log coordinates (you can store these in your model here)
        console.log(`Coordinates for ${shortUrl}: Latitude: ${lat}, Longitude: ${lng}`);
        return { lat, lng };
      } else {
        console.log("Could not extract coordinates for:", shortUrl);
        return null;
      }
    } else {
      console.log("Invalid Google Maps link:", shortUrl);
      return null;
    }
  } catch (err) {
    console.error("Error:", err);
    return null;
  } finally {
    await browser.close();
  }
};

const sendCartidgeMissedMessage = async (cust_id) => {
  const customer = await Customer.findById(cust_id);

  if (!customer) {
    return { success: false, message: `Customer Not Found With Id ${cust_id}` };
  }

  const Customer_Name = customer.display_name;
  const Customer_Phone = customer.mobile;

  await sendMissedCatridgeMsg(Customer_Phone, Customer_Name);
  const MissedCartidgeLog = {
    customerId: cust_id,
  }
  await MissedCartidge.create(MissedCartidgeLog);
  return { success: true, message: "Message Sent.." }
};

const getMissedCartidgeLog = async (customerId, startDate, endDate) => {
  const filter = {};

  if (customerId) {
    filter.customerId = customerId;
  }


  let start, end;

  if (!startDate || !endDate) {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  filter.timestamp = { $gte: start, $lte: end };

  const getMissedCartidgeData = await MissedCartidge
    .find(filter)
    .sort({ timestamp: -1 }) // descending order
    .populate('customerId', 'display_name contact_number first_name last_name mobile email');
  return getMissedCartidgeData
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
  getCustomerDropdown,
  getCustomerlocations,
  sendCartidgeMissedMessage,
  getMissedCartidgeLog
};
