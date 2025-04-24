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
    const { startDate, endDate, productId, userId, customerId, status  } = req.query;

    const logs = await logService.getAllLogs(startDate, endDate, productId, userId, customerId, status);

    res.json({ logs });
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

// exports.getLogsByProduct = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = parseInt(req.query.limit, 10) || 10;
//     const productId = req.params.productId;
//     const { startDate, endDate } = req.query;

//     const { totalProducts, logs } = await logService.getLogsByProduct(productId, page, limit, startDate, endDate);

//     res.json({
//       totalProducts,
//       totalPages: Math.ceil(totalProducts / limit),
//       currentPage: page,
//       logs,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getLogsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { startDate, endDate } = req.query;

    const { total, logs } = await logService.getLogsByProduct(productId, startDate, endDate);

    res.json({
      total,
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

exports.getTechnicianScore = async (req, res) => {
  try {

    const {startDate, endDate, userId} = req.query;

    const result = await logService.technicianScore(startDate, endDate, userId);

    res.json({
      result,
      message:"get scores.."
    })

  } catch (error)
  {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}