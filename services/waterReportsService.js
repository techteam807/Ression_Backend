const Reports = require("../models/waterReports");

const createReports = async (reportsData) => {
  return await Reports.create(reportsData);
};

const getReports = async (year, month, filter = {}) => {
  if (year) {
    filter.$expr = { $eq: [{ $year: "$createdAt" }, year] };
  }

  if (month) {
    filter.$expr = { $eq: [{ $year: "$createdAt" }, month] };
  }

  return await Reports.find(filter).populate('customerId', 'display_name');;
};

const generateWaterReports = async(customerId) => {
    const reports = await Reports.find({ customerId, status: false });

    const reportIds = reports.map(r => r._id);
    console.log(reportIds)

    const batches = [];

    for (let i = 0; i + 3 < reportIds.length; i += 4) {
        const batch = reportIds.slice(i, i + 4);
         batches.push({
            updateMany: {
        filter: { _id: { $in: batch } },
        update: { $set: { status: true } }
      }
         });
    }

    if (batches.length > 0) {
    await Reports.bulkWrite(batches);
  }


  return {
    customerId,
    totalReportsFound: reportIds.length,
    batchesUpdated: batches.length,
    reportsUpdated: batches.length * 4
  };
};

module.exports = { createReports, getReports, generateWaterReports };
