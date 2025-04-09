const { successResponse, errorResponse } = require("../config/response");
const UserService = require("../services/userServices");

const getUsers = async (req, res) => {
  try {
    const { user_status, search, page = 1, limit = 10 } = req.query;

    const result = await UserService.getUsers(user_status, search, page, limit);

    const { Users, ...pagination } = result;

    return successResponse(
      res,
      `${user_status} User get successfully`,
      pagination,
      Users
    );
  } catch (error) {
    return errorResponse(res, `Error get ${user_status} User`, 500, error);
  }
};

const signUpUser = async (req, res) => {
  try {
    const { user_name, mobile_number, country_code } = req.body;

    const Users = await UserService.signUpUser(
      { user_name, mobile_number, country_code },
      res
    );

    if (Users.success) {
      return successResponse(res, Users.message, null, null);
    } else {
      return errorResponse(res, Users.message, Users.statusCode);
    }

    // return successResponse(res, "User Sign Up successfully", null, null);
  } catch (error) {
    return errorResponse(res, "Error Sign Up User", 500, error);
  }
};

const signInUser = async (req, res) => {
  try {
    const { mobile_number, country_code } = req.body;

    const Users = await UserService.signInUser(
      mobile_number,
      country_code,
      res
    );

    if (Users.success) {
      return successResponse(res, Users.message, null, null);
    } else {
      return errorResponse(res, Users.message, Users.statusCode);
    }

    // return successResponse(res, "User Sign In successfully", null, null);
  } catch (error) {
    return errorResponse(res, "Error Sign In User", 500, error);
  }
};

const verifyUserRegister = async (req, res) => {
  try {
    const { mobile_number, country_code, otp } = req.body;

    const user = await UserService.verifyUserRegister(
      mobile_number,
      country_code,
      otp
    );

    // const Users = await UserService.signInUser(mobile_number);

    return successResponse(res, "User Sign Up and verified successfully", null, null);
  } catch (error) {
    return errorResponse(res, "Error Sign Up & verified User", 500, error);
  }
};

const verifyUserLogin = async (req, res) => {
  try {
    const { mobile_number, country_code, otp } = req.body;

    const user = await UserService.verifyUserLogin(
      mobile_number,
      country_code,
      otp
    );

    // const Users = await UserService.signInUser(mobile_number);

    return successResponse(res, "User Sign In and verified successfully", null, user);
  } catch (error) {
    return errorResponse(res, "Error Sign In & verified User", 500, error);
  }
};

const approveUser = async (req, res) => {
  try {
    const { mobile_number } = req.body;

    const result = await UserService.approveUser(mobile_number);

    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, result.data);
  } catch (error) {
    return errorResponse(res, "Error Approved User", 500, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { mobile_number } = req.body;

    const result = await UserService.deleteUser(mobile_number);

    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, result.data);
  } catch (error) {
    return errorResponse(res, "Error Deleted User", 500, error);
  }
};

const restoreUser = async (req, res) => {
  try {
    const { mobile_number } = req.body;

    const result = await UserService.restoreUser(mobile_number);

    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, result.data);
  } catch (error) {
    return errorResponse(res, "Error Restored User", 500, error);
  }
};

const logsOfUser = async (req, res) => {
  try {
    const { userId } = req.query;

    const logs = await UserService.logsOfUser(userId);

    return successResponse(res, "User logs get successfully", null, logs);
  } catch (error) {
    return errorResponse(res, "Error get USer Logs", 500, error);
  }
};

const getUserdropdown = async (req, res) => {
  try {
    const filter = { ...req.query };
    const Users = await UserService.getUserDropdown(filter);

    return successResponse(res, "User dropdown get successfully", null, Users);
  } catch (error) {
    return errorResponse(res, "Error get User dropdown", 500, error);
  }
};

module.exports = {
  getUsers,
  signUpUser,
  signInUser,
  verifyUserRegister,
  verifyUserLogin,
  approveUser,
  deleteUser,
  restoreUser,
  logsOfUser,
  getUserdropdown,
};
