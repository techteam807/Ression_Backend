const { ProductEnum } = require('../config/global');
const LogManagement = require('../models/logsManagement');
const moment = require('moment');

const getMinutesDiff = (start, end) => moment(end).diff(moment(start), 'minutes');

// Helper to calculate overlap with lunch break (12 PM to 2 PM)
const getLunchOverlap = (start, end) => {
  const lunchStart = moment(start).set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  const lunchEnd = moment(start).set({ hour: 14, minute: 0, second: 0, millisecond: 0 });

  const overlap = moment.min(moment(end), lunchEnd).diff(moment.max(moment(start), lunchStart), 'minutes');
  return Math.max(0, overlap);
};

exports.createLogold = async (logData) => {
    return await LogManagement.create(logData);
};

exports.createLog = async (logData, session = null) => {
  if (session) {
    return await LogManagement.create([logData], { session });
  }
  return await LogManagement.create(logData);
};


exports.getAllLogs = async (startDate, endDate, productId, userId, customerId, status ) => {
    const filter = {};
  
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999),
      };
    } else if (startDate) {
      filter.timestamp = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.timestamp = { $lte: new Date(endDate).setHours(23, 59, 59, 999) };
    }
  
    if (productId) {
      filter.products = productId;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (customerId) {
      filter.customerId = customerId;
    }

    if (status) {
      filter.status = status;
    }
  
    const logs = await LogManagement.find(filter)
      .populate({ path: "customerId", select: "display_name contact_number email mobile first_name last_name" })
      .populate({ path: "userId", select: "user_name mobile_number" })
      .populate({ path: "products", select: "productCode" })
      .sort({ timestamp: -1 });
  
    return logs;
  };
  


exports.getLogsByCustomer = async (customerId, page, limit) => {
    const skip = (page - 1) * limit;

    const logs = await LogManagement.find({ customerId })
        .populate({ path: "customerId", select: "display_name contact_number email mobile first_name last_name" })
        .populate({ path: "userId", select: "user_name mobile_number" })
        .populate({ path: "products", select: "productCode" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    const totalCustomer = await LogManagement.countDocuments({ customerId });

    return { totalCustomer, logs };
};

// exports.getLogsByProduct = async (productId, page, limit, startDate, endDate) => {
//     const skip = (page - 1) * limit;

//     const filter = {
//         products: productId,
//     };

//     if (startDate && endDate) {
//         filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate).setHours(23, 59, 59, 999) };
//     } else if (startDate) {
//         filter.timestamp = { $gte: new Date(startDate) };
//     } else if (endDate) {
//         filter.timestamp = { $lte: new Date(endDate).setHours(23, 59, 59, 999) };
//     }

//     const logs = await LogManagement.find(filter)
//         .populate({ path: "customerId", select: "display_name contact_number email mobile" })
//         .populate({ path: "userId", select: "user_name mobile_number" })
//         .populate({ path: "products", select: "productCode" })
//         .sort({ timestamp: -1 })
//         .skip(skip)
//         .limit(limit);

//     const totalProducts = await LogManagement.countDocuments(filter);

//     return { totalProducts, logs };
// };

exports.getLogsByProduct = async (productId, startDate, endDate) => {
    const filter = {
        products: productId,
    };

    if (startDate && endDate) {
        filter.timestamp = {
            $gte: new Date(startDate),
            $lte: new Date(endDate).setHours(23, 59, 59, 999),
        };
    } else if (startDate) {
        filter.timestamp = { $gte: new Date(startDate) };
    } else if (endDate) {
        filter.timestamp = {
            $lte: new Date(endDate).setHours(23, 59, 59, 999),
        };
    }

    const logs = await LogManagement.find(filter)
        .populate({ path: "customerId", select: "display_name contact_number email mobile first_name last_name" })
        .populate({ path: "userId", select: "user_name mobile_number" })
        .populate({ path: "products", select: "productCode" })
        .sort({ timestamp: -1 });

    return { total: logs.length, logs };
};



exports.getLogsByUser = async (userId, page, limit) => {
    const skip = (page - 1) * limit;

    const logs = await LogManagement.find({ userId })
        .populate({ path: "customerId", select: "display_name contact_number email mobile first_name last_name" })
        .populate({ path: "userId", select: "user_name mobile_number" })
        .populate({ path: "products", select: "productCode" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    const totalUsers = await LogManagement.countDocuments({ userId });

    return { totalUsers, logs };
};

exports.technicianScoreOne = async (startDate, endDate, userId) => {

  //find logs
  const logs = await LogManagement.find({
    userId:userId,
    status:ProductEnum.IN_USE,
    timestamp:{
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).populate('userId').sort({ userId: 1, timestamp: 1 });

  const groupedByTechnician = {};

  for (const log of logs) {
    const technicianId = log.userId._id.toString();
    const technicianName = log.userId.name || technicianId;
    const date = moment(log.timestamp).format('YYYY-MM-DD');

    if (!groupedByTechnician[technicianId]) {
      groupedByTechnician[technicianId] = {};
    }

    if (!groupedByTechnician[technicianId][date]) {
      groupedByTechnician[technicianId][date] = {
        name: technicianName,
        replacements: [],
      };
    }

    groupedByTechnician[technicianId][date].replacements.push(log.timestamp);
  }

  const results = [];

  for (const techId in groupedByTechnician) {
    for (const date in groupedByTechnician[techId]) {
      const timestamps = groupedByTechnician[techId][date].replacements;
      const techName = groupedByTechnician[techId][date].name;
      const scores = [];

      for (let i = 1; i < timestamps.length; i++) {
        const start = timestamps[i - 1];
        const end = timestamps[i];

        const timeTaken = getMinutesDiff(start, end);
        const lunchOverlap = getLunchOverlap(start, end);
        const adjustedTime = timeTaken - lunchOverlap;

        const IDEAL = 30;
        const PENALTY = 1.5;
        const BONUS = 0.5;

        let score;

        if (adjustedTime > IDEAL) {
          score = Math.max(0, 100 - (adjustedTime - IDEAL) * PENALTY);
        } else {
          score = 100 + (IDEAL - adjustedTime) * BONUS;
        }

        scores.push(score);

      }
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      results.push({
        technician: techName,
        date,
        totalReplacements: timestamps.length,
        averageEfficiencyScore: parseFloat(avgScore.toFixed(2)),
      });
    }
  }
  return results;
};

exports.technicianScore = async (startDate, endDate, userId) => {
  const filter = {};
  const today = moment();

  let startMoment, endMoment;

  // Handle startDate if it's provided
  if (!startDate && !endDate) {
    // Case 1: Neither date provided → use current week's start and end
    startMoment = today.clone().startOf('week');
    endMoment = today.clone().endOf('week');
  } else if (startDate && !endDate) {
    // Case 2: Only startDate provided → use the same day's start and end
    startMoment = moment(startDate, "YYYY-MM-DD HH:mm:ss").startOf('day');
    endMoment = moment(startDate, "YYYY-MM-DD HH:mm:ss").endOf('day');
  } else {
    // Case 3: Either one or both provided
    if (startDate) {
      startMoment = moment(startDate, "YYYY-MM-DD HH:mm:ss").startOf('day');
    }
    if (endDate) {
      endMoment = moment(endDate, "YYYY-MM-DD HH:mm:ss").endOf('day');
    }
  }

  if (startMoment) {
    filter.timestamp = { $gte: startMoment.toDate() };
  }
  if (endMoment) {
    filter.timestamp = {
      ...filter.timestamp,
      $lte: endMoment.toDate(),
    };
  }

if(userId)
{
  filter.userId = userId;
}
  // Fetch logs
  const logs = await LogManagement.find({
    status: ProductEnum.IN_USE,
    ...filter,
  }).populate('userId').sort({ timestamp: 1 });

  const groupedByTechnician = {};

  for (const log of logs) {
    if (!log.userId) continue;
    const technicianId = log.userId._id.toString();
    const technicianName = log.userId.user_name || technicianId; // <- updated here
    const date = moment(log.timestamp).format('YYYY-MM-DD');

    if (!groupedByTechnician[technicianId]) {
      groupedByTechnician[technicianId] = {};
    }

    if (!groupedByTechnician[technicianId][date]) {
      groupedByTechnician[technicianId][date] = {
        name: technicianName,
        replacements: [],
      };
    }

    groupedByTechnician[technicianId][date].replacements.push(log.timestamp);
  }

  const finalResult = [];

  for (const techId in groupedByTechnician) {
    console.log(groupedByTechnician)
    const techLogs = groupedByTechnician[techId];
    let totalReplacements = 0;
    let totalScore = 0;
    let scoreCount = 0;
    let dateRangeStart = null;
    let dateRangeEnd = null;
    let technicianName = "";
    let totalAdjustedTime = 0

    for (const date in techLogs) {
      const timestamps = techLogs[date].replacements;
      const techName = techLogs[date].name;
      technicianName = techName;
      technicianId = techLogs[date]._id;
      const scores = [];

      totalReplacements += timestamps.length;

      for (let i = 1; i < timestamps.length; i++) {
        const start = timestamps[i - 1];
        const end = timestamps[i];

        const timeTaken = getMinutesDiff(start, end);
        console.log("tm:",timeTaken);
        
        const lunchOverlap = getLunchOverlap(start, end);
        console.log("lt:",lunchOverlap);
        

        const adjustedTime = timeTaken - lunchOverlap;
        console.log("at:",adjustedTime);
        

        const IDEAL = 30;
        const PENALTY = 1.5;
        const BONUS = 0.5;

        let score;

        if (adjustedTime > IDEAL) {
          score = Math.max(0, 100 - (adjustedTime - IDEAL) * PENALTY);
        } else {
          score = 100 + (IDEAL - adjustedTime) * BONUS;
        }

        scores.push(score);
        console.log("s:",score);
        
        totalScore += score;
        console.log("t:",totalScore);
        scoreCount++;
        console.log("sc:",scoreCount);

        totalAdjustedTime += adjustedTime; // Accumulate adjusted time

        
      }

      if (!dateRangeStart || moment(date).isBefore(dateRangeStart)) {
        dateRangeStart = date;
      }
      if (!dateRangeEnd || moment(date).isAfter(dateRangeEnd)) {
        dateRangeEnd = date;
      }
    }

    const avgScore = totalScore / scoreCount;
    const avgTimePerReplacement = totalAdjustedTime / scoreCount;


    finalResult.push({
      technician_id:techId,
      technician: technicianName,
      totalReplacements,
      averageEfficiencyScore: parseFloat(avgScore.toFixed(2)),
      averageReplacementTime: parseFloat(avgTimePerReplacement.toFixed(2))
    });

    finalResult.sort((a, b) => b.averageEfficiencyScore - a.averageEfficiencyScore);
  }

  return finalResult;
};

exports.technicianScoreByDay = async(startDate, endDate) => {
   const filter = {};
  const today = moment();

  let startMoment, endMoment;

  // Handle startDate if it's provided
  if (!startDate && !endDate) {
    // Case 1: Neither date provided → use current week's start and end
    // startMoment = today.clone().startOf('week');
    // endMoment = today.clone().endOf('week');
     startMoment = moment('2025-04-01', 'YYYY-MM-DD');
     endMoment = moment('2025-05-31', 'YYYY-MM-DD');
  } else if (startDate && !endDate) {
    // Case 2: Only startDate provided → use the same day's start and end
    startMoment = moment(startDate, "YYYY-MM-DD HH:mm:ss").startOf('day');
    endMoment = moment(startDate, "YYYY-MM-DD HH:mm:ss").endOf('day');
  } else {
    // Case 3: Either one or both provided
    if (startDate) {
      startMoment = moment(startDate, "YYYY-MM-DD HH:mm:ss").startOf('day');
    }
    if (endDate) {
      endMoment = moment(endDate, "YYYY-MM-DD HH:mm:ss").endOf('day');
    }
  }

  if (startMoment) {
    filter.timestamp = { $gte: startMoment.toDate() };
  }
  if (endMoment) {
    filter.timestamp = {
      ...filter.timestamp,
      $lte: endMoment.toDate(),
    };
  }
  // Fetch logs
  const logs = await LogManagement.find({
    status: ProductEnum.IN_USE,
    ...filter,
  }).populate('userId').sort({ timestamp: 1 });

  const groupedByTechnician = {};

  for (const log of logs) {
    if (!log.userId) continue;
    const technicianId = log.userId._id.toString();
    const technicianName = log.userId.user_name || technicianId; // <- updated here
    const date = moment(log.timestamp).format('YYYY-MM-DD');

    if (!groupedByTechnician[technicianId]) {
      groupedByTechnician[technicianId] = {};
    }

    if (!groupedByTechnician[technicianId][date]) {
      groupedByTechnician[technicianId][date] = {
        name: technicianName,
        replacements: [],
      };
    }

    groupedByTechnician[technicianId][date].replacements.push(log.timestamp);
  }

  const finalResult = [];

for (const techId in groupedByTechnician) {
  const techLogs = groupedByTechnician[techId];

  for (const date in techLogs) {
    const timestamps = techLogs[date].replacements;
    const technicianName = techLogs[date].name;

    let totalReplacements = timestamps.length;
    let totalScore = 0;
    let scoreCount = 0;
    let totalAdjustedTime = 0;

    for (let i = 1; i < timestamps.length; i++) {
      const start = timestamps[i - 1];
      const end = timestamps[i];

      const timeTaken = getMinutesDiff(start, end);
      const lunchOverlap = getLunchOverlap(start, end);
      const adjustedTime = timeTaken - lunchOverlap;

      const IDEAL = 30;
      const PENALTY = 1.5;
      const BONUS = 0.5;

      let score;

      if (adjustedTime > IDEAL) {
        score = Math.max(0, 100 - (adjustedTime - IDEAL) * PENALTY);
      } else {
        score = 100 + (IDEAL - adjustedTime) * BONUS;
      }

      totalScore += score;
      totalAdjustedTime += adjustedTime;
      scoreCount++;
    }

    const avgScore = scoreCount ? totalScore / scoreCount : 0;
    const avgTimePerReplacement = scoreCount ? totalAdjustedTime / scoreCount : 0;

    finalResult.push({
      technician_id: techId,
      technician: technicianName,
      date,
      totalReplacements,
      averageEfficiencyScore: parseFloat(avgScore.toFixed(2)),
      averageReplacementTime: parseFloat(avgTimePerReplacement.toFixed(2))
    });
  }
}

// Optional: Sort by date then by technician name or score
finalResult.sort((a, b) => new Date(a.date) - new Date(b.date));
  return finalResult;
};