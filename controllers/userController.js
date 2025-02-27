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
        const {user_name,city,mobile_number} = req.body;

        const Users = await UserService.signUpUser({user_name,city,mobile_number});
       
      successResponse(res, "User Sign Up successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Sign Up User",500,error);
    }
};

const signInUser = async (req,res) => {
    try {
        const {mobile_number} = req.body;

        const Users = await UserService.signInUser(mobile_number);
       
      successResponse(res, "User Sign In successfully", null, Users);
    } catch (error) {
      errorResponse(res, "Error Sign In User",500,error);
    }
};

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

module.exports = {getUsers,signUpUser,signInUser,approveUser,deleteUser,restoreUser}