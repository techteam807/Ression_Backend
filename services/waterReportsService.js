const Reports = require("../models/waterReports");
const Customers = require("../models/customerModel");
// const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
// const { PDFDocument } = require('pdf-lib');
// const fs = require('fs');
// const path = require('path');
const { sendWaterReportPdf } = require("./whatsappMsgServices");

// const chartWidth = 600;
// const chartHeight = 400;
// const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: chartWidth, height: chartHeight });

// Generate one chart PDF for a batch of reports
// const generatePDFForBatch = async (batchReports, customerId, index) => {
//   const labels = batchReports.map(r => new Date(r.createdAt).toLocaleDateString());
//   const scores = batchReports.map(r => parseFloat(r.waterScore));

//   const chartBuffer = await chartJSNodeCanvas.renderToBuffer({
//     type: 'bar',
//     data: {
//       labels,
//       datasets: [{
//         label: 'Water Score',
//         data: scores,
//         backgroundColor: 'rgba(0, 123, 255, 0.6)'
//       }]
//     },
//     options: {
//       scales: {
//         y: { beginAtZero: true }
//       }
//     }
//   });

//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([chartWidth, chartHeight + 50]);
//   const image = await pdfDoc.embedPng(chartBuffer);

//   page.drawImage(image, {
//     x: 0,
//     y: 50,
//     width: chartWidth,
//     height: chartHeight
//   });

//   const pdfBytes = await pdfDoc.save();
//   const fileName = `water-report-${customerId}-batch${index + 1}.pdf`;
//   const filePath = path.join(__dirname, '../reports', fileName);
//   fs.writeFileSync(filePath, pdfBytes);

//   return fileName;
// };

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


const generateWaterReportsOld = async (customerId) => {
  const reports = await Reports.find({ customerId, status: false });

  const customer = await Customers.findById(customerId);

  const rawMobile = customer.mobile;
  const customerMobileNumber = rawMobile.replace(/\D/g, '').slice(-10);
  const customerName = customer.display_name;

  const reportIds = reports.map(r => r._id);
  console.log(reportIds)

  const batches = [];
  // const generatedFiles = [];

  for (let i = 0; i + 3 < reportIds.length; i += 4) {
    const batch = reportIds.slice(i, i + 4);
    batches.push({
      updateMany: {
        filter: { _id: { $in: batch } },
        update: { $set: { status: true } }
      }
    });

    //  const batchReports = await Reports.find({ _id: { $in: batch } });

    // const fileName = await generatePDFForBatch(batchReports, customerId, batches.length - 1);
    // generatedFiles.push(fileName);
  }

  if (batches.length > 0) {
    await Reports.bulkWrite(batches);
  }

  const docUrl = `https://file-examples.com/storage/fef7b79c7f68230219872f8/2017/10/file-sample_150kB.pdf`
  await sendWaterReportPdf(customerMobileNumber, customerName, docUrl)

  return {
    customerId,
    totalReportsFound: reportIds.length,
    batchesUpdated: batches.length,
    reportsUpdated: batches.length * 4,
    pdfFiles: generatedFiles,
  };
};

const generateWaterReports = async (customerId, logIds) => {
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

  // const docUrl = `https://file-examples.com/storage/fef7b79c7f68230219872f8/2017/10/file-sample_150kB.pdf`;

  // await sendWaterReportPdf(customerMobileNumber, customerName, docUrl);

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


module.exports = { createReports, getReports, generateWaterReports, adminAddOrUpdateWaterReport };
