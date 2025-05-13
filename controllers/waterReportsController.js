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

const generatWatereReports = async (req, res) => {
try{

    const {customerId} = req.query;

    const result = await WaterReportService.generateWaterReports(customerId)
return successResponse(
      res,
      "Water Reports genrated successfully",
      null,
      result
    );
}
catch (error) {
    return errorResponse(res, "Error fetching Water Reports", 500, error);
}
};


module.exports = { getWaterReports, generatWatereReports };
