const express = require("express");
const WareHouseController = require("../controllers/wareHouseController");
const { validateRequest } = require("../config/validation");
const { createWareHouse } = require('../validations/wareHouseValidation');
const router = express.Router();

router.get('/',WareHouseController.getAllWareHouses);
router.get('/code',WareHouseController.getWareHousesByCode);
router.post('/',validateRequest(createWareHouse),WareHouseController.createWareHouses);
router.delete('/delete/:id',WareHouseController.deleteWareHouses);

module.exports = router;