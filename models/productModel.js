const mongoose = require("mongoose");
const { ProductEnum } = require('../config/global.js');

const ProductSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: true,
      unique: true,
    },
    distributorType :String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    resinType:{type: String},
    vesselSize:{type: String},
    adapterSize:{type:String},
    productStatus: { 
      type: String, 
          enum: Object.values(ProductEnum),
          default: ProductEnum.NEW 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
