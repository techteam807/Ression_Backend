const logService = require('../services/logManagementService');

exports.createLog = async (req, res) => {
  try {
    const log = await logService.createLog(req.body);
    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

exports.getAllLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const { totalLogs, logs } = await logService.getAllLogs(page, limit);

    res.json({
      totalLogs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: page,
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLogsByCustomer = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const customerId = req.params.customerId;

    const { totalCustomer, logs } = await logService.getLogsByCustomer(customerId, page, limit);

    res.json({
      totalCustomer,
      totalPages: Math.ceil(totalCustomer / limit),
      currentPage: page,
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLogsByProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const productId = req.params.productId;

    const { totalProducts, logs } = await logService.getLogsByProduct(productId, page, limit);

    res.json({
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLogsByUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const userId = req.params.userId;

    const { totalUsers, logs } = await logService.getLogsByUser(userId, page, limit);

    res.json({
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
