const express = require("express");
const router = express.Router();
const logManagementController = require("../controllers/logsManagementController");

const {
    createLogSchema,
    getAllLogsSchema,
    getProduct,
    getCustomer,
    getUser
} = require("../validations/logManagementValidation");


router.post("/logs", createLogSchema, logManagementController.createLog);
router.get("/logs",getAllLogsSchema, logManagementController.getAllLogs);
router.get("/logs/customer/:customerId", getCustomer, logManagementController.getLogsByCustomer);
router.get("/logs/product/:productId", getProduct, logManagementController.getLogsByProduct);
router.get("/logs/user/:userId", getUser, logManagementController.getLogsByUser);
router.get("/logs/technicianScore",logManagementController.getTechnicianScore);

module.exports = router;
