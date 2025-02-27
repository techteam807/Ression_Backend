const { successResponse, errorResponse } = require("../config/response");
const UserService = require('../services/userServices');

const getUsers = async (req,res) => {
    try {
        const {user_status} = req.query;

        const Users = await UserService.getUsers(user_status);
       
        successResponse(res, `${user_status} User get successfully`, null, Users);
      } catch (error) {
        errorResponse(res, `Error get ${user_status} User`,500,error);
      }
};

const signUpUser = async (req,res) => {
    try {
        const {userName,city,mobileNumber} = req.body;

        const Users = await UserService.signUpUser(userName,city,mobileNumber);
       
      successResponse(res, "User Sign Up successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Sign Up User",500,error);
    }
};

const signInUser = async (req,res) => {
    try {
        const {mobileNumber} = req.body;

        const Users = await UserService.signInUser(mobileNumber);
       
      successResponse(res, "User Sign In successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Sign In User",500,error);
    }
};

const approveUser = async (req,res) => {
    try {
        const {userId} = req.body;

        const Users = await UserService.approveUser(userId);
      successResponse(res, "User Approved successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Approved User",500,error);
    }
}

const deleteUser = async (req,res) => {
    try {
        const {userId} = req.body;

        const Users = await UserService.deleteUser(userId);
       
      successResponse(res, "User Deleted successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Deleted User",500,error);
    }
}

const restoreUser = async (req,res) => {
    try {
        const {userId} = req.body;

        const Users = await UserService.restoreUser(userId);
      successResponse(res, "User Restored successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Restored User",500,error);
    }
}

module.exports = {getUsers,signUpUser,signInUser,approveUser,deleteUser,restoreUser}