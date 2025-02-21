const express = require("express");
const { storeCustomers ,getCustomers} = require("../controllers/userControllers");

const router = express.Router();

router.post("/store-customers", storeCustomers);
router.get("/",getCustomers)

module.exports = router;
