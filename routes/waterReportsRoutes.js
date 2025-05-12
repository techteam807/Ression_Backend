const express = require("express");
const WaterReportsController = require("../controllers/waterReportsController");
const router = express.Router();

router.get('/getReports',WaterReportsController.getWaterReports);
router.post('/genrateReports',WaterReportsController.generatWatereReports);

module.exports = router;