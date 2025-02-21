const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    productCode: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[A-Za-z]{4}\d{4}$/.test(value); // 4 letters + 4 digits
        },
        message: "Product code must have 4 letters followed by 4 digits (e.g., ABCD1234)",
      },
    },
    productDesc: String,
    isActive:Boolean,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
