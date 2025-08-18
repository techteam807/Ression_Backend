const mongoose = require("mongoose");

const ClusterSchema = new mongoose.Schema(
  {
    clusterNo: {
      type: Number,
      required: true,
    },
    cartridge_qty: {
      type: Number,
    },
    clusterName:{
      type: String,
    },
    // customers: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Customer",
    //     required: true,
    //   },
    // ],
    customers: [
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    sequenceNo: {
      type: Number,
       default: 0,
    },
    indexNo: {
      type: Number,
      default: 0,
    },
    isFreezed: {
    type: Boolean,
    default: false,
    },
  }
]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cluster", ClusterSchema);
