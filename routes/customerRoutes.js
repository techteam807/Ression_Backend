const express = require("express");
const CustomerController = require("../controllers/customerControllers");
const { validateRequest } = require("../config/validation");
const {customerSchema  } = require("../validations/customerValidation");

const router = express.Router();

router.post("/store-customers", validateRequest(customerSchema), CustomerController.storeCustomers);
router.get("/",CustomerController.getCustomers);
router.get('/code',CustomerController.getCustomerByCode);
router.post('/manageProductsOld',CustomerController.ReplaceProductsOld);
router.post('/manageProductsNew',CustomerController.ReplaceProductsNew);


module.exports = router;
