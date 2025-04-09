const mongoose = require('mongoose');

const adminotpSchema = new mongoose.Schema({
    otp: { type: String, required: true },
    expiration: { type: Date, required: true },
});

module.exports = mongoose.model('adminOtp', adminotpSchema);
