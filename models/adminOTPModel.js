const mongoose = require('mongoose');

const adminotpSchema = new mongoose.Schema({
    otp: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now, expire: 120 },
});

module.exports = mongoose.model('adminOtp', adminotpSchema);
