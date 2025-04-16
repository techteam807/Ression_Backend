const { successResponse, errorResponse } = require("../config/response");
const WareHouseService = require("../services/wareHouseServices");

const getAllWareHouses = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    const result = await WareHouseService.getWareHouses(filter, search);

    return successResponse(
      res,
      "WareHouses fetched successfully",
      null,
      result
    );
  } catch (error) {
    return errorResponse(res, "Error fetching WareHouses", 500, error);
  }
};

const getWareHousesByCode = async (req, res) => {
  try {
    const { wareHouse_code } = req.query;

    const wareHouse = await WareHouseService.getwareHousesByCode(
      wareHouse_code
    );

    if (!wareHouse) {
      return errorResponse(res, "wareHouse not found", 404);
    }

    return successResponse(
      res,
      "wareHouse fetched successfully",
      null,
      wareHouse
    );
  } catch (error) {
    return errorResponse(res, "Error fetching wareHouse by code", 500, error);
  }
};

const createWareHouses = async (req, res) => {
  try {
    const { wareHouse_code } = req.body;

    const newWareHouse = await WareHouseService.createWareHouse(wareHouse_code);

    return successResponse(
      res,
      "wareHouse created successfully",
      null,
      newWareHouse
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message.includes("E11000")
        ? "wareHouse code must be unique"
        : error.message,
      400
    );
  }
};

const deleteWareHouses = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await WareHouseService.deleteWareHouse(id);

    if (!result.success) {
      return errorResponse(res, result.message, 404, null);
    }

    return successResponse(res, result.message, null, null);
  } catch (error) {
    return errorResponse(res, "Error deleting wareHouse", 500, error);
  }
};

const scanMultipleProductsByCode = async (req, res) => {
  try {
    const { Product_Codes, wareHouse_code,userId} = req.body;

    if (!Array.isArray(Product_Codes) || Product_Codes.length === 0) {
      return errorResponse(res, "Invalid Data Pass", 400, null);
    }

    const result = await WareHouseService.scanMultipleProducts(
      Product_Codes,
      wareHouse_code,
      userId
    );

    // if (result.success) {
    //   return successResponse(res, result.message, null, null);
    // } else {
    //   return errorResponse(res, result.ProductCodes, 400, null);
    // }

        if (result.success) {
          return successResponse(res, result.message, null, null);
        }
        else if (!result.success && result.ProductCodes)
        {
          return errorResponse(res, result.ProductCodes, 400, null);
        }
        else {
          return errorResponse(res, result.errorMessage, 400, null);
        }
  } catch (error) {
    return errorResponse(
      res,
      "Error While Scanning  Product codes",
      500,
      error
    );
  }
};

module.exports = {
  getAllWareHouses,
  getWareHousesByCode,
  createWareHouses,
  deleteWareHouses,
  scanMultipleProductsByCode,
};
