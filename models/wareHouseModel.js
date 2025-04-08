const mongoose = require("mongoose");

const WareHouseSchema = new mongoose.Schema(
  {
    wareHouseCode:{
        type:String,
        required:true,
        unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WareHouse", WareHouseSchema);