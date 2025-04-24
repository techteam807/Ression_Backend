const mongoose = require("mongoose");
const { ProductEnum } = require('../config/global.js');

const logManagementSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" }, 
  WareHouseId: { type: mongoose.Schema.Types.ObjectId, ref: "WareHouse" }, 
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { 
    type: String, 
    enum: Object.values(ProductEnum),
    default: ProductEnum.NEW 
  }, 
  isActive: { type: Boolean, default: true },
  productNotes:String,
  timestamp: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model("LogManagement", logManagementSchema);
