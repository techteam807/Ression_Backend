const express = require("express");
const SuperAdmin = require('../SuperAdmin/manageCustomer');
const router = express.Router();

router.put('/clearProductOfCutomer',SuperAdmin.clearProducts);
router.patch('/manage-product-status', SuperAdmin.manageProductStatus);

module.exports = router;
