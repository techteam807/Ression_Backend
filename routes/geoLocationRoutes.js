const express = require("express");
const GeoLocationController = require("../controllers/geoLocationController");
const router = express.Router();

router.post('/geoLocation/store',GeoLocationController.AddGeoLocation);
router.get('/geoLocations',GeoLocationController.GetGeoLocations);

module.exports = router;