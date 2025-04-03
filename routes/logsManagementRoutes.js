// routes/logManagementRoutes.js

const express = require("express");
const router = express.Router();
const logManagementController = require("../controllers/logManagementController");

router.post("/logs", logManagementController.createLog);

router.get("/logs", logManagementController.getAllLogs);

router.get("/logs/customer/:customerId", logManagementController.getLogsByCustomer);

router.get("/logs/product/:productId", logManagementController.getLogsByProduct);

router.get("/logs/user/:userId", logManagementController.getLogsByUser);

module.exports = router;
