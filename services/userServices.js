const User = require("../models/userModel");
const Log = require("../models/logModel");
const Otp = require("../models/otpModel");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');

const lastOtpRequest = {};  

const interaktApiKey = process.env.INTERAKT_API_KEY;
console.log(interaktApiKey)
const interaktUrl = process.env.INTERAKT_URL;
console.log(interaktUrl)
const jwtSecret = process.env.JWTSECRET;
console.log(jwtSecret)

const getUsers1 = async (user_status) => {
  const status = user_status ? { user_status } : {};
  return await User.find(status);
};

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

const signUpUserOld = async (userData,res) => {
//   const existingUser = await User.findOne({
//     mobile_number: userData.mobile_number,
//   });

//   if (existingUser) {
//     throw new Error("User already exists");
//   }

//   return await User.create(userData);

let user = await User.findOne({ mobile_number:userData.mobile_number });
console.log(":",user)
if (user) {
    if (user.user_status === "deleted") {
      throw new Error("This user is deleted. Please contact support.");
    }
    if (!user.verified) {
      user.user_name = userData.user_name;
      await user.save();
    } else {
      throw new Error("User is already registered and verified, please login");
    }
  } else {
    user = await User.create({
      user_name:userData.user_name,
      mobile_number:userData.mobile_number,
      verified: false,
    });
  }

  if (userData.mobile_number === "+919999999999") {
    return res.status(200).json({
        status: true,
        message: "User registered successfully. Use OTP 123456 to verify.",
    });
}

   if (lastOtpRequest[user._id] && Date.now() - lastOtpRequest[user._id] < 2 * 60 * 1000) {
    return res.status(400).json({
        status: false,
        message: "Please wait at least 2 minutes before requesting another OTP.",
    });
}

lastOtpRequest[user._id] = Date.now();

const otp = Math.floor(100000 + Math.random() * 900000);
const expiration = new Date(Date.now() + 2 * 60 * 1000); 

const countryCode = userData.mobile_number.slice(0, 3);
const phoneNumber = userData.mobile_number.slice(3);

await axios.post(interaktUrl, {
    countryCode: countryCode,
    phoneNumber: phoneNumber,
    callbackData: "OTP",
    type: "Template",
    template: {
        name: "doshion_app",
        languageCode: "en",
        bodyValues: [otp.toString()],
        buttonValues: {
            "0": [otp.toString()]
        }
    }
}, {
    headers: {
        Authorization: `Basic ${interaktApiKey}`,
        "Content-Type": "application/json"
    }
});

        // Save the OTP in the Otp collection
        const otpRecord = await Otp.create({
            userId: user._id,
            otp: otp.toString(),
            expiration: expiration,
        });

        setTimeout(async () => {
            await Otp.deleteOne({ _id: otpRecord._id });
            console.log("OTP expired and removed from database");
        }, 2 * 60 * 1000);
};

const signUpUser = async (userData) => {
  let user = await User.findOne({ mobile_number: userData.mobile_number });

  if (user) {
    if (user.user_status === "deleted") {
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

  const countryCode = userData.mobile_number.slice(0, 3);
  const phoneNumber = userData.mobile_number.slice(3);

  await axios.post(
    interaktUrl,
    {
      countryCode: countryCode,
      phoneNumber: phoneNumber,
      callbackData: "OTP",
      type: "Template",
      template: {
        name: "doshion_app",
        languageCode: "en",
        bodyValues: [otp.toString()],
        buttonValues: {
          0: [otp.toString()],
        },
      },
    },
    {
      headers: {
        Authorization: `Basic ${interaktApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

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


const signInUserold = async (mobile_number,res) => {
//   const user = await User.findOne({ mobile_number });
//   if (!user) {
//     throw new Error("User not found");
//   }
//   return user;

let user = await User.findOne({ mobile_number });

if (!user) {
    return res.status(404).json({
      status: false,
      message: "User not found",
    });
  }

  if (user.user_status === "deleted") {
    return res.status(400).json({
        status: false,
        message: "This user is deleted. Please contact support.",
    });
}

if (user.user_status !== "approve") {
    return res.status(400).json({
      status: false,
      message: "Your account has not been approved yet.",
    });
  }

  if (mobile_number === "+919999999999") {
    return res.status(200).json({
      status: true,
      message: "OTP sent to your mobile number. Use OTP 123456 to login.",
    });
  }

  if (
    lastOtpRequest[user._id] &&
    Date.now() - lastOtpRequest[user._id] < 2 * 60 * 1000
  ) {
    return res.status(400).json({
      status: false,
      message:
        "Please wait at least 2 minutes before requesting another OTP.",
    });
  }

  lastOtpRequest[user._id] = Date.now();

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiration = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

  const countryCode = mobile_number.slice(0, 3);
  const phoneNumber = mobile_number.slice(3);

  await axios.post(
    interaktUrl,
    {
      countryCode: countryCode,
      phoneNumber: phoneNumber,
      callbackData: "OTP",
      type: "Template",
      template: {
        name: "doshion_app",
        languageCode: "en",
        bodyValues: [otp.toString()],
        buttonValues: {
          0: [otp.toString()],
        },
      },
    },
    {
      headers: {
        Authorization: `Basic ${interaktApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const otpRecord = await Otp.create({
    userId: user._id,
    otp: otp.toString(),
    expiration: expiration,
  });

  // Set a timeout to delete the OTP after 2 minutes
  setTimeout(async () => {
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log("OTP expired and removed from database");
  }, 2 * 60 * 1000);
  
};

const signInUser = async (mobile_number) => {
  let user = await User.findOne({ mobile_number });

  if (!user) {
    return { success: false, message: "User not found", statusCode: 404 };
  }

  if (user.user_status === "deleted") {
    return { success: false, message: "This user is deleted. Please contact support.", statusCode: 400 };
  }

  if (user.user_status !== "approve") {
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

  await axios.post(
    interaktUrl,
    {
      countryCode: mobile_number.slice(0, 3),
      phoneNumber: mobile_number.slice(3),
      callbackData: "OTP",
      type: "Template",
      template: { name: "doshion_app", languageCode: "en", bodyValues: [otp.toString()], buttonValues: { 0: [otp.toString()] } },
    },
    { headers: { Authorization: `Basic ${interaktApiKey}`, "Content-Type": "application/json" } }
  );

  const otpRecord = await Otp.create({ userId: user._id, otp: otp.toString(), expiration });

  setTimeout(async () => {
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log("OTP expired and removed from database");
  }, 2 * 60 * 1000);

  return { success: true, message: "OTP has been sent to your mobile number.", statusCode: 200 };
};



const verifyUserRegister = async (mobile_number, otp) => {
  const user = await User.findOne({ mobile_number });

  if (!user) {
    return response.notFound("User not found");
  }

  if (mobile_number === "+919999999999" && otp === "123456") {
    user.verified = true;
    user.user_status = "approved";
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

const verifyUserLogin = async (mobile_number, otp) => {
  const user = await User.findOne({ mobile_number });

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

  if (user.user_status !== "approve") {
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
};
