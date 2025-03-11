const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    time: { type: String, required: true },
});

module.exports = mongoose.model('Log', logSchema);
