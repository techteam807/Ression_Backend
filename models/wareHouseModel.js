const mongoose = require("mongoose");

const WareHouseSchema = new mongoose.Schema(
  {
    wareHouseCode:{
        type:String,
        required:true,
        unique: true,
      //   validate: {
      //   validator: function (value) {
      //     // return /^[A-Za-z]{4}\d{4}$/.test(value); 
      //     return /^\d{4}\.\d{2}\.\d{2}\.[A-Za-z]$/.test(value);
      //   },
      //   // message: "Product code must have 4 letters followed by 4 digits (e.g., ABCD1234)",
      //   message:"WareHouse code must follow the format: 1054.59.25.W"
      // },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WareHouse", WareHouseSchema);