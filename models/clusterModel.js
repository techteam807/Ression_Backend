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
    customers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cluster", ClusterSchema);
