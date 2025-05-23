const { successResponse, errorResponse } = require("../config/response");
const WaterReportService = require("../services/waterReportsService");

const getWaterReports = async (req, res) => {
  try {
    let { year, month } = req.query;

    // Convert query params to numbers if they exist
    year = year ? parseInt(year) : undefined;
    month = month ? parseInt(month) : undefined;

    const result = await WaterReportService.getReports(year, month);

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

const generatWatereReports = async (req, res) => {
  try {
    const { customerId, logIds } = req.body;

    if (!customerId || !Array.isArray(logIds) || logIds.length === 0) {
      return errorResponse(res, "customerId and logIds[] are required", 400);
    }

    const result = await WaterReportService.generateWaterReports(
      customerId,
      logIds
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

module.exports = { getWaterReports, generatWatereReports, adminAddOrUpdate, deleteWaterReport };
