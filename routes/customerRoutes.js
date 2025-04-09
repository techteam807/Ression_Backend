const express = require("express");
const CustomerController = require("../controllers/customerControllers");
const { validateRequest } = require("../config/validation");
const {getCustomerByCode,manageProductsNew,manageProductsOld  } = require("../validations/customerValidation");

const router = express.Router();
router.post("/zoho-customers",CustomerController.ZohoCustomers);
router.post("/store-customers",CustomerController.storeCustomers);
router.get("/",CustomerController.getCustomers);
router.get("/customerDropdown",CustomerController.getCustomerdropdown);
router.get('/code',validateRequest(getCustomerByCode),CustomerController.getCustomerByCode);
// router.post('/manageProductsOld',validateRequest(manageProductsOld),CustomerController.ReplaceProductsOld);
// router.post('/manageProductsNew',validateRequest(manageProductsNew),CustomerController.ReplaceProductsNew);
router.post('/manageProducts',CustomerController.ManageCustomerAndProducts);


module.exports = router;
