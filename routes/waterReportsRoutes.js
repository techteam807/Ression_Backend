const express = require("express");
const WaterReportsController = require("../controllers/waterReportsController");
const router = express.Router();

router.get('/getReports',WaterReportsController.getWaterReports);
router.post('/genrateReports',WaterReportsController.generatWatereReports);
router.post('/admin-add-or-update', WaterReportsController.adminAddOrUpdate);

module.exports = router;