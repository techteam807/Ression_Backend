const { successResponse, errorResponse } = require("../config/response");
const UserService = require('../services/userServices');

const getUsers = async (req,res) => {
    try {
        const {user_status, search, page = 1, limit = 10 } = req.query;

        const result = await UserService.getUsers(user_status, search, page, limit);

        const { Users, ...pagination } = result;
       
        successResponse(res, `${user_status} User get successfully`, pagination, Users);
      } catch (error) {
        errorResponse(res, `Error get ${user_status} User`,500,error);
      }
};

const signUpUser = async (req,res) => {
    try {
        const {user_name,mobile_number} = req.body;

        const Users = await UserService.signUpUser({user_name,mobile_number},res);
       
      successResponse(res, "User Sign Up successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Sign Up User",500,error);
    }
};

const signInUser = async (req,res) => {
    try {
        const {mobile_number} = req.body;

        const Users = await UserService.signInUser(mobile_number,res);
       
      successResponse(res, "User Sign In successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Sign In User",500,error);
    }
};

const verifyUserRegister = async (req,res) => {
  try {
    const {mobile_number,otp} = req.body;

    const user = await UserService.verifyUserRegister(mobile_number,otp);

    // const Users = await UserService.signInUser(mobile_number);
   
  successResponse(res, "User Sign Up and verified successfully", null, user);
} catch (error) {
  errorResponse(res, "Error Sign Up & verified User",500,error);
}
}

const verifyUserLogin = async (req,res) => {
  try {
    const {mobile_number,otp} = req.body;

    const user = await UserService.verifyUserLogin(mobile_number,otp);

    // const Users = await UserService.signInUser(mobile_number);
   
  successResponse(res, "User Sign In and verified successfully", null, user);
} catch (error) {
  errorResponse(res, "Error Sign In & verified User",500,error);
}
}

const approveUser = async (req,res) => {
    try {
        const {mobile_number} = req.body;

        const Users = await UserService.approveUser(mobile_number);
      successResponse(res, "User Approved successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Approved User",500,error);
    }
}

const deleteUser = async (req,res) => {
    try {
        const {mobile_number} = req.body;

        const Users = await UserService.deleteUser(mobile_number);
       
      successResponse(res, "User Deleted successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Deleted User",500,error);
    }
}

const restoreUser = async (req,res) => {
    try {
        const {mobile_number} = req.body;

        const Users = await UserService.restoreUser(mobile_number);
      successResponse(res, "User Restored successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Restored User",500,error);
    }
}

const logOfUser = async (req,res) => {
  try {
    const {userId} = req.query;

    const logs = await UserService.logsOfUser(userId);

  successResponse(res, "User logs Managed successfully", null, logs);
} catch (error) {
  errorResponse(res, "Error Manage USer Logs",500,error);
}
}

module.exports = { getUsers,signUpUser,signInUser,verifyUserRegister,verifyUserLogin,approveUser,deleteUser,restoreUser,logOfUser };