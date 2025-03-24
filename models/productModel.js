const mongoose = require("mongoose");
const { ProductEnum } = require('../config/global.js');

const ProductSchema = new mongoose.Schema(
  {
    // productName: { type: String, required: true },
    productCode: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          // return /^[A-Za-z]{4}\d{4}$/.test(value); 
          return /^\d{3,4}\.\d{1,2}\.\d{2}\.[A-Za-z]{1,4}$/.test(value);
        },
        // message: "Product code must have 4 letters followed by 4 digits (e.g., ABCD1234)",
        message:"Product code must follow the format: 0000.00.00.ABCD Upto"
      },
    },
    // productDesc: String,
    // connectorType :String,
    distributorType :String,
    // size:String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    resinType:{type: String},
    vesselSize:{type: String},
    adapterSize:{type:String},
    productStatus: { type: String, enum: [ProductEnum.NEW, ProductEnum.EXHAUSTED, ProductEnum.IN_USE], required: true, default: ProductEnum.NEW},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
