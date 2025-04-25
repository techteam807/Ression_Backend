const mongoose = require("mongoose");

const MissedCartidgeSchema = new mongoose.Schema(
    {
customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
timestamp: { type: Date, default: Date.now }, 
    });

module.exports = mongoose.model("MissedCartidge", MissedCartidgeSchema);