const express = require("express");
const router = express.Router();

//import routes files
const ProductRoutes = require('./productRoute');
const CustomerRoutes = require('./customerRoutes');
const UserRoutes = require('./userRoutes');
const WareHouseRoutes = require('./wareHouseRoutes');
const logsManagement = require('./logsManagementRoutes');

//allow to use your route files
router.use('/customers',CustomerRoutes);
router.use('/products',ProductRoutes);
router.use('/users',UserRoutes);
router.use('/wareHouse',WareHouseRoutes);
router.use('/logsManagement',logsManagement);

module.exports = router;
