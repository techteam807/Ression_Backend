const User = require('../models/userModel');

const getUsers = async (user_status) => {
    const status = user_status ? { user_status } : {};
    return await User.find(status);
};

const signUpUser = async (userData) => {
    const existingUser = await User.findOne({ mobile_number: userData.mobile_number });
    
    if (existingUser) {
        throw new Error("User already exists");
    }

    return await User.create(userData);
};

const signInUser = async (mobile_number) => {
    const user = await User.findOne({ mobile_number });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
};

const approveUser = async () => {
    return await User.findByIdAndUpdate(user_id, { user_status: "approve" }, { new: true });
};

const deleteUser = async () => {
    return await User.findByIdAndUpdate(user_id, { user_status: "delete" }, { new: true });
};

const restoreUser = async () => {
    return await User.findByIdAndUpdate(user_id, { user_status: "pending" }, { new: true });
};

module.exports = { getUsers, signUpUser, signInUser, approveUser, deleteUser, restoreUser }