// routes/logManagementRoutes.js

const express = require("express");
const router = express.Router();
const logManagementController = require("../controllers/logsManagementController");
const { validateLog, validatePagination } = require("../validations/logManagementValidation");

router.post("/logs", validateLog, logManagementController.createLog);

router.get("/logs", validatePagination, logManagementController.getAllLogs);

router.get("/logs/customer/:customerId", validatePagination, logManagementController.getLogsByCustomer);

router.get("/logs/product/:productId", validatePagination, logManagementController.getLogsByProduct);

router.get("/logs/user/:userId", validatePagination, logManagementController.getLogsByUser);

module.exports = router;
