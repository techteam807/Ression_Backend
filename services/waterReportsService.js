const Reports = require("../models/waterReports");
const Customers = require("../models/customerModel");
const { sendWaterReportPdf } = require("./whatsappMsgServices");
const {Storage}= require('@google-cloud/storage');
const storage = new Storage({projectId: process.env.GCLOUD_PROJECT});
const bucket = storage.bucket(process.env.GCS_BUCKET);
/**
 * Upload a PDF buffer to GCS and return the public URL.
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimetype
 * @returns {Promise<string>} publicUrl
 */

const createReports = async (reportsData) => {
  return await Reports.create(reportsData);
};

const getReports = async (year, month, filter = {}) => {
  if (year && month) {
    filter.$expr = {
      $and: [
        { $eq: [{ $year: "$date" }, year] },
        { $eq: [{ $month: "$date" }, month] }
      ]
    };
  } else if (year) {
    filter.$expr = { $eq: [{ $year: "$date" }, year] };
  } else if (month) {
    filter.$expr = { $eq: [{ $month: "$date" }, month] };
  }

  return await Reports.find(filter).populate('customerId', 'display_name');
};

const generateWaterReports = async (customerId, logIds, docUrl) => {
  const reports = await Reports.find({
    customerId,
    status: false,
    _id: { $in: logIds }
  });

  const customer = await Customers.findById(customerId);
  const rawMobile = customer.mobile;
  const customerMobileNumber = rawMobile.replace(/\D/g, '').slice(-10);
  const customerName = customer.display_name;

  const reportIds = reports.map(r => r._id);

  if (reportIds.length > 0) {
    await Reports.updateMany(
      { _id: { $in: reportIds } },
      { $set: { status: true } }
    );
  }

  await sendWaterReportPdf(customerMobileNumber, customerName, docUrl);

  return {
    customerId,
    totalReportsFound: reportIds.length,
    reportsUpdated: reportIds.length,
    updatedReportIds: reportIds,
  };
};

const adminAddOrUpdateWaterReport = async ({ customerId, date, waterScore,status }) => {
  if (!customerId || !date || !waterScore) {
    throw new Error("customerId, date, and waterScore are required");
  }

  const inputDate = new Date(date);

  // Normalize to start and end of the day
  const startOfDay = new Date(inputDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(inputDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find existing report
  const existingReport = await Reports.findOne({
    customerId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (existingReport) {
    // Update if found
    existingReport.waterScore = waterScore;
    // Update status only if it's provided in the request
    if (typeof status !== 'undefined') {
        existingReport.status = status; // store as string: "true" or "false"
    }
    existingReport.date = inputDate; // update just to normalize
    await existingReport.save();
    return { message: "Water report updated", data: existingReport };
  } else {
    // Create if not found
    const newReport = await Reports.create({
      customerId,
      date: inputDate,
      waterScore
    });
    return { message: "Water report added", data: newReport };
  }
};

const deleteWaterReports = async (logId) => {
    const report = await Reports.findById(logId);

  if(!report)
    {
      return { success: false, message: "waterReport not found"};
    }
  await Reports.findByIdAndDelete(logId);

   return {
    success: true,
    message: "WaterReport deleted successfully",
   }
};

const uploadPdf = async (buffer, originalName, mimetype) => {
  if (mimetype !== 'application/pdf') {
    throw new Error("Only PDF Allowed");
  }

  const fileName = `${Date.now()}-${originalName.replace(/\s+/g, '_')}`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    resumable: false,
    contentType: mimetype
  });

  const uploadedUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(fileName)}`;
;

  return {
    uploadedUrl
  };
};



module.exports = { createReports, getReports, generateWaterReports, adminAddOrUpdateWaterReport, deleteWaterReports, uploadPdf };
