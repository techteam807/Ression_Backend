const { successResponse, errorResponse } = require("../config/response");
const WaterReportService = require("../services/waterReportsService");

const getWaterReports = async (req, res) => {
  try {
    let { year, month, startDate, endDate, search  } = req.query;

    // Convert query params to numbers if they exist
    year = year ? parseInt(year) : undefined;
    month = month ? parseInt(month) : undefined;

    const result = await WaterReportService.getReports(year, month, startDate, endDate, search );

    return successResponse(
      res,
      "Water Reports fetched successfully",
      null,
      result
    );
  } catch (error) {
    return errorResponse(res, "Error fetching Water Reports", 500, error);
  }
};

const generatWatereReportsold = async (req, res) => {
  try {
    const { customerId } = req.query;

    const result = await WaterReportService.generateWaterReports(customerId);
    return successResponse(
      res,
      "Water Reports genrated successfully",
      null,
      result
    );
  } catch (error) {
    return errorResponse(res, "Error fetching Water Reports", 500, error);
  }
};

const generatWatereReportsOLD = async (req, res) => {
  try {
    const { customerId, logIds, docUrl } = req.body;

    if (!customerId || !Array.isArray(logIds) || logIds.length === 0) {
      return errorResponse(res, "customerId and logIds[] are required", 400);
    }

    const result = await WaterReportService.generateWaterReports(
      customerId,
      logIds,
      docUrl
    );

    return successResponse(
      res,
      "Water Reports generated successfully",
      null,
      result
    );
  } catch (error) {
    return errorResponse(res, "Error generating Water Reports", 500, error);
  }
};

const generatWatereReports = async (req, res) => {
  try {
    const { customerId, logIds, pdfUrl } = req.body;

    if (!customerId || !Array.isArray(logIds) || logIds.length === 0) {
      return errorResponse(res, "customerId and logIds[] are required", 400);
    }

    const result = await WaterReportService.generateWaterReports(
      customerId,
      logIds,
      pdfUrl
    );

    return successResponse(
      res,
      "Water Reports generated successfully",
      null,
      result
    );
  } catch (error) {
    return errorResponse(res, "Error generating Water Reports", 500, error);
  }
};

const adminAddOrUpdate = async (req, res) => {
  try {
    const result = await WaterReportService.adminAddOrUpdateWaterReport(
      req.body
    );
    return res.status(result.data.createdAt ? 201 : 200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteWaterReport = async (req, res) => {
  try {
    const { logId } = req.params;

    const result = await WaterReportService.deleteWaterReports(logId);
    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, null);
  } catch (error) {
    return errorResponse(res, "Error While Delete WaterReport", 500, error);
  }
};

const uploadPdfold = async (req, res, next) =>
{
  try {
    if(!req.file)
    {
      return errorResponse(res, "no file provided", 500, error);
    }

    const result = await WaterReportService.uploadPdf(req.file.buffer, req.file.originalname, req.file.mimetype);
    return successResponse(res, "url Genarted..", null, result);
  }
  catch (error)
    {
      next(error);
return errorResponse(res, "Error While upload WaterReport", 500, error);
    }
}

const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "No file provided", 400);
    }

    const result = await WaterReportService.uploadPdf(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return successResponse(res, "URL generated successfully", result);
  } catch (error) {
    console.error("uploadPdf error:", error);
    return errorResponse(res, "Error while uploading WaterReport", 500, error);
  }
};

const SendMultipleWaterReport = async (req, res) => {
  try {
    let { customersLogsMap } = req.body;
    if (typeof customersLogsMap === "string") {
      customersLogsMap = JSON.parse(customersLogsMap);
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return errorResponse(res, "PDF files required", 400);
    }

    const results = [];
    for (const file of files) {
      console.log("Processing file:", file.originalname);
      
      // extract customer_code from filename (for logging only)
      const customerCode = file.originalname.split("-Report")[0];
      console.log(`Customer Code: ${customerCode}`);

      // find matching _id from customersLogsMap
      const customerId = Object.keys(customersLogsMap).find((id) =>
        customersLogsMap[id] ? true : false
      );

      const logIds = customersLogsMap[customerId];
      console.log(`Found customerId: ${customerId} with logIds: ${logIds}`);
      if (!logIds) continue;

      const uploaded = await WaterReportService.uploadPdf(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      const result = await WaterReportService.generateWaterReports(
        customerId, // ✅ real Mongo _id
        logIds,
        uploaded.uploadedUrl
      );

      results.push({ customerId, customerCode, ...result });
    }

    return successResponse(res, "Reports generated & sent successfully", null, results);
  } catch (error) {
    console.error("Bulk water report error:", error);
    return errorResponse(res, "Error While sending WaterReport", 500, error);
  }
};

module.exports = { getWaterReports, generatWatereReports, adminAddOrUpdate, deleteWaterReport, uploadPdf, SendMultipleWaterReport };
