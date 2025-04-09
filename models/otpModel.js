const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    CreatedAt: { type: Date, default: Date.now, expire: 120 },
});

module.exports = mongoose.model('Otp', otpSchema);
