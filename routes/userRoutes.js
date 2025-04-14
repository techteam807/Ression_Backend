const express = require("express");

const UserController = require('../controllers/userController');
const {validateRequest} = require('../config/validation');
const { getUser,signUpUser,signInUser,approveUser,deleteUser,restoreUser } = require('../validations/userValidation'); 

const router = express.Router();

router.get('/getUsers',validateRequest(getUser),UserController.getUsers);
router.post('/signUpUser',UserController.signUpUser);
router.post('/verifySignUp',UserController.verifyUserRegister);
router.post('/signInUser',UserController.signInUser);
router.post('/verifySignIn',UserController.verifyUserLogin);
router.put('/approveUser',UserController.approveUser);
router.put('/deleteUser',UserController.deleteUser);
router.delete('/deleteUsers',UserController.deleteUserHard);
router.put('/restoreUser',UserController.restoreUser);
router.get('/getlogs',UserController.logsOfUser);
router.get('/getUsersDropdown',UserController.getUserdropdown);

module.exports = router;