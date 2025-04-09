const express = require("express");
const SuperAdmin = require('../SuperAdmin/manageCustomer');
const router = express.Router();

router.put('/clearProductOfCutomer',SuperAdmin.clearProducts);
router.patch('/manage-product-status', SuperAdmin.manageProductStatus);
router.post('/sendOtpProductDelete',SuperAdmin.sendOtpForDeleteProduct);
router.post('/productDeleteProcess',SuperAdmin.deleteProductProcess);

module.exports = router;
