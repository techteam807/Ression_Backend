const express = require("express");
const CustomerController = require("../controllers/customerControllers");
const { validateRequest } = require("../config/validation");
const {getCustomerByCode,manageProductsNew,manageProductsOld  } = require("../validations/customerValidation");

const router = express.Router();
router.post("/zoho-customers",CustomerController.ZohoCustomers);
router.post("/store-customers",CustomerController.storeCustomers);
router.get("/",CustomerController.getCustomers);
router.get("/customerDropdown",CustomerController.getCustomerdropdown);
router.get("/customerLocation",CustomerController.getCustomerlocation);
router.get('/customerLocationCluster', CustomerController.getClusteredCustomers);
router.get('/clusters', CustomerController.getClusters);
router.put("/clusters/reassign-batch", CustomerController.reassignMultipleCustomers);
router.get('/code',validateRequest(getCustomerByCode),CustomerController.getCustomerByCode);
// router.post('/manageProductsOld',validateRequest(manageProductsOld),CustomerController.ReplaceProductsOld);
// router.post('/manageProductsNew',validateRequest(manageProductsNew),CustomerController.ReplaceProductsNew);
router.post('/manageProducts',CustomerController.ManageCustomerAndProducts);
router.post('/SendMissedCartidgeMsg',CustomerController.sendCartidgeMissedMsg);
router.get('/missedCartidgeLog',CustomerController.MissedCartidgeLog);



module.exports = router;
