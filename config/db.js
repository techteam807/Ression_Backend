// const { MongoClient } = require("mongodb");
// require("dotenv").config();

// const uri = process.env.MONGODB_URI;
// const client = new MongoClient(uri);

// async function connectDB() {
//   try {
//     await client.connect();
//     console.log("Connected to MongoDB");
//     return client.db("taskdb");
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//     process.exit(1);
//   }
// }

// module.exports = connectDB;

const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
       serverSelectionTimeoutMS: 30000,     
      });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
