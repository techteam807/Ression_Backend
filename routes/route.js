const express = require("express");
const router = express.Router();

//import routes files
const ProductRoutes = require('./productRoute');
const TaskRoutes = require('./taskRoutes');
const CustomerRoutes = require('./userRoutes');

//allow to use your route files
router.use('/tasks',TaskRoutes);
router.use('/customers',CustomerRoutes);
router.use('/products',ProductRoutes);

module.exports = router;
