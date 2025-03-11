const express = require("express");

const UserController = require('../controllers/userController');
const {validateRequest} = require('../config/validation');
const { getUser,signUpUser,signInUser,approveUser,deleteUser,restoreUser } = require('../validations/userValidation'); 

const router = express.Router();

router.get('/getUsers',validateRequest(getUser),UserController.getUsers);
router.post('/signUpUser',validateRequest(signUpUser),UserController.signUpUser);
router.post('/verifySignUp',UserController.verifyUserRegister);
router.post('/signInUser',validateRequest(signInUser),UserController.signInUser);
router.post('/verifySignIn',UserController.verifyUserLogin);
router.put('/approveUser',validateRequest(approveUser),UserController.approveUser);
router.put('/deleteUser',validateRequest(deleteUser),UserController.deleteUser);
router.put('/restoreUser',validateRequest(restoreUser),UserController.restoreUser);
router.get('/getlogs',UserController.logsOfUser)

module.exports = router;