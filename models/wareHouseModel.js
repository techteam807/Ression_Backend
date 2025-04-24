const mongoose = require("mongoose");

const WareHouseSchema = new mongoose.Schema(
  {
    wareHouseCode:{
        type:String,
        required:true,
        unique: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], 
  },
  { timestamps: true }
);

module.exports = mongoose.model("WareHouse", WareHouseSchema);