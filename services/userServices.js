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

const axios = require("axios");
const Customer = require("../models/usermodel");

const ZOHO_API_URL = "https://www.zohoapis.in/subscriptions/v1/customers"; 

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

    const existingCustomerIds = new Set(existingCustomers.map((c) => c.customer_id)); 

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

const getAllcustomers = async () => {
  return await Customer.find();
};

module.exports = { fetchAndStoreCustomers ,getAllcustomers };
