const mongoose = require("mongoose");
  const { WeekdayEnum } = require("../config/global");

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
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    day: {
      type: String,
      enum: Object.values(WeekdayEnum)
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cluster", ClusterSchema);
