const LogManagement = require('../models/logsManagement');

exports.createLog = async (req, res) => {
  try {
    const { customerId, products, userId, status } = req.body;

    const newLog = new LogManagement({
      customerId,
      products,
      userId,
      status,
    });

    const log = await newLog.save();
    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Get all log entries with pagination
exports.getAllLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await LogManagement.find()
      .populate('customerId userId products')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLogs = await LogManagement.countDocuments();

    res.json({
      totalLogs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: parseInt(page),
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get logs by customer ID
exports.getLogsByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const logs = await LogManagement.find({ customerId })
      .populate('customerId userId products')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get logs by product ID
exports.getLogsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const logs = await LogManagement.find({ products: productId })
      .populate('customerId userId products')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get logs by user (technician) ID
exports.getLogsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const logs = await LogManagement.find({ userId })
      .populate('customerId userId products')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
