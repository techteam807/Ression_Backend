const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    expiration: { type: Date, required: true },
});

module.exports = mongoose.model('Otp', otpSchema);
