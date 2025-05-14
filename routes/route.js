const express = require("express");
const router = express.Router();

//import routes files
const ProductRoutes = require('./productRoute');
const CustomerRoutes = require('./customerRoutes');
const ClusterRoutes = require('./clusterRoutes');
const UserRoutes = require('./userRoutes');
const WareHouseRoutes = require('./wareHouseRoutes');
const SuperAdmin = require('./superAdminRoute');
const LogsManagement = require('./logsManagementRoutes');
const Location = require('./geoLocationRoutes');
const WaterReport = require('./waterReportsRoutes');


//allow to use your route files
router.use('/customers',CustomerRoutes);
router.use('/cluster',ClusterRoutes);
router.use('/products',ProductRoutes);
router.use('/users',UserRoutes);
router.use('/wareHouse',WareHouseRoutes);
router.use('/admin',SuperAdmin)
router.use('/logsManagement',LogsManagement);
router.use('/location',Location);
router.use('/waterReport',WaterReport);

module.exports = router;
