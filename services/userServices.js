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

const approveUser = async (mobile_number) => {
    const user = await User.findOne({ mobile_number });

    if (!user) throw new Error("User not found");

    if (user.user_status === "approve") {
        throw new Error("User is already approved.");
    }

    if (user.user_status !== "pending") {
        throw new Error("Only pending users can be approved.");
    }

    return await User.findOneAndUpdate(
        { mobile_number },
        { user_status: "approve" },
        { new: true } 
    );
};

const deleteUser = async (mobile_number) => {
    const user = await User.findOne({ mobile_number });

    if (!user) throw new Error("User not found");

    if (user.user_status === "delete") {
        throw new Error("User is already deleted.");
    }

    if (user.user_status !== "approve" || user.user_status !== "pending" ) {
        throw new Error("Only approve users can be deleted.");
    }

    return await User.findOneAndUpdate(
        { mobile_number },
        { user_status: "delete" },
        { new: true } 
    );
};

const restoreUser = async (mobile_number) => {
    const user = await User.findOne({ mobile_number });

    if (!user) throw new Error("User not found");

    if (user.user_status === "pending") {
        throw new Error("User is already pending.");
    }

    if (user.user_status !== "delete") {
        throw new Error("Only deleted users can be restored.");
    }

    return await User.findOneAndUpdate(
        { mobile_number },
        { user_status: "pending" },
        { new: true } 
    );
};


module.exports = { getUsers, signUpUser, signInUser, approveUser, deleteUser, restoreUser }