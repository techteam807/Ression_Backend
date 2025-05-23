const express = require("express");
const WaterReportsController = require("../controllers/waterReportsController");
const router = express.Router();

router.get('/getReports',WaterReportsController.getWaterReports);
router.post('/genrateReports',WaterReportsController.generatWatereReports);
router.post('/admin-add-or-update', WaterReportsController.adminAddOrUpdate);
router.delete('/deleteWaterReports/:logId',WaterReportsController.deleteWaterReport);

module.exports = router;