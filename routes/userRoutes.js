const express = require("express");
const { storeCustomers } = require("../controllers/userControllers");

const router = express.Router();

router.post("/store-customers", storeCustomers);

module.exports = router;
