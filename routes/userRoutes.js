const express = require("express");
const CustomerController = require("../controllers/userControllers");
const { validateRequest } = require("../config/validation");
const {customerSchema  } = require("../validations/customerValidation");

const router = express.Router();

router.post("/store-customers", validateRequest(customerSchema), CustomerController.storeCustomers);
router.get("/",CustomerController.getCustomers);
router.get('/code',CustomerController.getCustomerByCode);

module.exports = router;
