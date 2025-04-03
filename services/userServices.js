const User = require("../models/userModel");
const Log = require("../models/logModel");
const Otp = require("../models/otpModel");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');
const request = require("request");
const { UserEnum } = require('../config/global');

const lastOtpRequest = {};  

const interaktApiKey = process.env.INTERAKT_API_KEY;
console.log(interaktApiKey)
const interaktUrl = process.env.INTERAKT_URL;
console.log(interaktUrl)
const jwtSecret = process.env.JWTSECRET;
console.log(jwtSecret)

const getUsers = async (user_status, search, page, limit) => {
  let filter = search
    ? {
        $or: [
          { user_name: new RegExp(search, "i") },
          { mobile_number: new RegExp(search, "i") },
        ],
      }
    : {};

  if (user_status) {
    filter.user_status = user_status;
  }

  const options = {
    skip: (page - 1) * limit,
    limit: parseInt(limit),
  };

  const Users = await User.find(filter).skip(options.skip).limit(options.limit);

  const totalRecords = await User.countDocuments(filter);

  return {
    totalData: totalRecords,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalRecords / limit),
    Users,
  };
};

const getUserByMobileNumber = async(mobile_number) => {
return await User.findOne({mobile_number:mobile_number});
};

const signUpUser = async (userData) => {
  let user = await User.findOne({ country_code: userData.country_code, mobile_number: userData.mobile_number });

  if (user) {
    if (user.user_status === UserEnum.DELETE) {
      return { success: false, message: "This user is deleted. Please contact support.", statusCode: 400 };
    }
    if (!user.verified) {
      user.user_name = userData.user_name;
      await user.save();
    } else {
      return { success: false, message: "User is already registered and verified, please login.", statusCode: 400 };
    }
  } else {
    user = await User.create({
      user_name: userData.user_name,
      mobile_number: userData.mobile_number,
      country_code: userData.country_code,
      verified: false,
    });
  }

  if (userData.mobile_number === "+919999999999") {
    return { success: true, message: "User registered successfully. Use OTP 123456 to verify.", statusCode: 200 };
  }

  if (lastOtpRequest[user._id] && Date.now() - lastOtpRequest[user._id] < 2 * 60 * 1000) {
    return { success: false, message: "Please wait at least 2 minutes before requesting another OTP.", statusCode: 400 };
  }

  lastOtpRequest[user._id] = Date.now();

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiration = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

  const countryCode = userData.country_code;
  const phoneNumber = userData.mobile_number;

  await sendWhatsAppOtp(phoneNumber,otp);

  const otpRecord = await Otp.create({
    userId: user._id,
    otp: otp.toString(),
    expiration: expiration,
  });

  setTimeout(async () => {
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log("OTP expired and removed from database");
  }, 2 * 60 * 1000);

  return { success: true, message: "User registered successfully. OTP sent to your mobile number.", statusCode: 200 };
};

const signInUser = async (mobile_number,country_code) => {
  let user = await User.findOne({ country_code,mobile_number });

  if (!user) {
    return { success: false, message: "User not found", statusCode: 404 };
  }

  if (user.user_status === UserEnum.DELETE) {
    return { success: false, message: "This user is deleted. Please contact support.", statusCode: 400 };
  }

  if (user.user_status !== UserEnum.APPROVE) {
    return { success: false, message: "Your account has not been approved yet.", statusCode: 400 };
  }

  if (mobile_number === "+919999999999") {
    return { success: true, message: "OTP sent to your mobile number. Use OTP 123456 to login.", statusCode: 200 };
  }

  if (lastOtpRequest[user._id] && Date.now() - lastOtpRequest[user._id] < 2 * 60 * 1000) {
    return { success: false, message: "Please wait at least 2 minutes before requesting another OTP.", statusCode: 400 };
  }

  lastOtpRequest[user._id] = Date.now();

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiration = new Date(Date.now() + 2 * 60 * 1000);

  await sendWhatsAppOtp(mobile_number,otp);
  const otpRecord = await Otp.create({ userId: user._id, otp: otp.toString(), expiration });

  setTimeout(async () => {
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log("OTP expired and removed from database");
  }, 2 * 60 * 1000);

  return { success: true, message: "OTP has been sent to your mobile number.", statusCode: 200 };
};

const verifyUserRegister = async (mobile_number,country_code, otp) => {
  const user = await User.findOne({ country_code,mobile_number });

  if (!user) {
    return response.notFound("User not found");
  }

  if (mobile_number === "+919999999999" && otp === "123456") {
    user.verified = true;
    user.user_status = UserEnum.APPROVE;
    await user.save();

    return user;
  }

  const otpRecord = await Otp.findOne({
    userId: user._id,
    otp,
    expiration: { $gt: Date.now() },
  });

  if (!otpRecord) {
    throw { status: 400, message: "Invalid or expired OTP" };
  }

  if (otpRecord) {
    user.verified = true;
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    return user;
  }
};

const verifyUserLogin = async (mobile_number,country_code, otp) => {
  const user = await User.findOne({ country_code,mobile_number });

  //current time
  const currentIST = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!user) {
    return response.notFound("User not found");
  }

  // Hardcoded Admin Login (For Testing Purposes)
  if (mobile_number === "+919999999999" && otp === "123456") {
    // Generate a JWT token with a 1-day expiration
    const token = jwt.sign({ userId: user._id, mobile_number }, jwtSecret, {
      expiresIn: "1d",
    });

    //create log
    await Log.create({ userId: user._id, time: currentIST });

    return { token, user };
  }

  // Find the OTP record
  const otpRecord = await Otp.findOne({
    userId: user._id,
    otp,
    expiration: { $gt: Date.now() },
  });

  if (!otpRecord) {
    throw { status: 400, message: "Invalid or expired OTP" };
  }

  //dynamic
  if (otpRecord) {
    // OTP is valid, proceed with login
    // Generate a JWT token with a 1-day expiration
    const token = jwt.sign({ userId: user._id, mobile_number }, jwtSecret, {
      expiresIn: "1d",
    });

    // Remove the OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    //create log
    await Log.create({ userId: user._id, time: currentIST });

    return { token, user };
  }
};

const approveUser = async (mobile_number) => {
  const user = await getUserByMobileNumber(mobile_number);

  if (!user)
  {
    return { success: false, message: "User not found"};
  }

  if (user.user_status === UserEnum.APPROVE) {
    // throw new Error("User is already approved.");
    return { success: false, message: "User is already approved."};
  }

  if (user.user_status !== UserEnum.PENDING) {
    // throw new Error("Only pending users can be approved.");
    return { success: false, message: "Only pending users can be approved."};
  }

  const approvedUser = await User.findOneAndUpdate(
    { mobile_number },
    { user_status: UserEnum.APPROVE },
    { new: true }
  );

  return {
    success: true,
    message: "User approved successfully",
    data: approvedUser,
  };
};

const deleteUser = async (mobile_number) => {
  const user = await getUserByMobileNumber(mobile_number);

  if (!user) 
    {
      return { success: false, message: "User not found"};
    }

  if (user.user_status === UserEnum.DELETE) {
    // throw new Error("User is already deleted.");
    return { success: false, message: "User is already deleted."};
  }

  if (user.user_status !== UserEnum.APPROVE) {
    // throw new Error("Only approve users can be deleted.");
    return { success: false, message: "Only approve users can be deleted."};
  }

  const deletedUser = await User.findOneAndUpdate(
    { mobile_number },
    { user_status: UserEnum.DELETE },
    { new: true }
  );

  return {
    success: true,
    message: "User deleted successfully",
    data: deletedUser,
  };
};

const restoreUser = async (mobile_number) => {
  const user = await getUserByMobileNumber(mobile_number);

  if (!user)
    {
      return { success: false, message: "User not found"};
    }

  if (user.user_status === UserEnum.PENDING) {
    // throw new Error("User is already pending.");
    return { success: false, message: "User is already pending."};
  }

  if (user.user_status !== UserEnum.DELETE) {
    // throw new Error("Only deleted users can be restored.");
    return { success: false, message: "Only deleted users can be restored."};
  }

  const restoredUser = await User.findOneAndUpdate(
    { mobile_number },
    { user_status: UserEnum.PENDING },
    { new: true }
  );

  return {
    success: true,
    message: "User restored successfully",
    data: restoredUser,
  };
};

const logsOfUser = async (userId) => {
  const filter = userId ? { userId } : {};

  const logs = await Log.find(filter).sort({ time: -1 }).populate({
    path: "userId",
    select: "user_name",
  });

  if (logs.length === 0) {
    return res.status(404).json({
      status: false,
      message: userId
        ? `No logs found for user ID: ${userId}`
        : "No logs found",
    });
  }

  return logs;
};

const sendWhatsAppOtp = async (mobile_number, otp) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: process.env.GALLABOX_URL,
      headers: {
        apisecret: process.env.GALLABOX_API_SECRET, // lowercase
        apikey: process.env.GALLABOX_API_KEY, // lowercase
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: process.env.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: mobile_number,
          phone: `91${mobile_number}`,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: "bw_scan_app",
            bodyValues: { otp: otp.toString() }, // Change from object to array
          },
        },
      }),
    };

    request(options, (error, response) => {
      if (error) {
        console.error("Error sending WhatsApp OTP:", error);
        return reject({ success: false, message: "Failed to send OTP via WhatsApp." });
      }
      console.log("WhatsApp Message Sent:", response.body);
      resolve({ success: true, message: "OTP sent successfully." });
    });
  });
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
  sendWhatsAppOtp
};
