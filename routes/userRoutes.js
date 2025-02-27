const express = require("express");

const UserController = require('../controllers/userController');

const router = express.Router();

router.get('/getUsers',UserController.getUsers);
router.post('/signUpUser',UserController.signUpUser);
router.post('/signInUser',UserController.signInUser);
router.put('/approveUser',UserController.approveUser);
router.put('/deleteUser',UserController.deleteUser);
router.put('/restoreUser',UserController.restoreUser);

module.exports = router;