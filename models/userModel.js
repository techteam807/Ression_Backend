const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    user_name:{
        type:String,
        required:true,
    },
    // city:{
    //     type:String,
    //     required:true,
    // },
    mobile_number:{
        type:String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    user_status: {
        type: String,
        default: "pending", // approve , delete
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);