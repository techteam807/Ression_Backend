const express = require("express");
const WaterReportsController = require("../controllers/waterReportsController");
const multer = require("multer");
const router = express.Router();

const upload = multer({
storage: multer.memoryStorage(),
limits:{ fileSize: 10 * 1024 * 1024 }
})

router.get('/getReports',WaterReportsController.getWaterReports);
router.post('/genrateReports',WaterReportsController.generatWatereReports);
router.post('/admin-add-or-update', WaterReportsController.adminAddOrUpdate);
router.delete('/deleteWaterReports/:logId',WaterReportsController.deleteWaterReport);
router.post('/uploadWaterReportPdf',upload.single('file'),WaterReportsController.uploadPdf);
router.post(
  "/uploadWaterReportBulk",
  upload.array("files"),
  WaterReportsController.SendMultipleWaterReport
);


module.exports = router;