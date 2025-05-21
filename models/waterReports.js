const mongoose = require('mongoose');

const WaterReportsSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer"}, 
    waterScore: String,
    date: { type: Date, required: true }, 
    status:{type:String,default:false}
},
{ timestamps: true }
);

module.exports = mongoose.model('waterReports', WaterReportsSchema);