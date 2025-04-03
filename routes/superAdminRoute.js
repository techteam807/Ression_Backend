const express = require("express");
const SuperAdmin = require('../SuperAdmin/manageCustomer');
const router = express.Router();

router.put('/clearProductOfCutomer',SuperAdmin.clearProducts);

module.exports = router;
