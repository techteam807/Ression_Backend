const { successResponse, errorResponse } = require("../config/response");
const WareHouseService = require('../services/wareHouseServices');

const getAllWareHouses = async (req, res) => {
    try {
        const { search } = req.query;
        let filter = {};

        const result = await WareHouseService.getWareHouses(filter, search);
        
        successResponse(res, "WareHouses fetched successfully", null, result);
      } catch (error) {
        errorResponse(res, "Error fetching WareHouses",500,error);
      }
};

const getWareHousesByCode = async (req, res) => {
     try {
        const { wareHouse_code } = req.query;
    
        const wareHouse = await WareHouseService.getwareHousesByCode(wareHouse_code);
    
        if (!wareHouse) {
          return errorResponse(res, "wareHouse not found", 404);
        }
    
        successResponse(res, "wareHouse fetched successfully", null, wareHouse);
      } catch (error) {
        errorResponse(res, "Error fetching wareHouse by code",500,error);
      }
};

const createWareHouses = async (req, res) => {
    try { 
        const {wareHouse_code} = req.body;

        const newWareHouse = await WareHouseService.createWareHouse(wareHouse_code);

        successResponse(res, "wareHouse created successfully", null, newWareHouse);
    } catch (error) {
        errorResponse(res,error.message.includes("E11000")? "wareHouse code must be unique": error.message,400);
    }
};

const deleteWareHouses = async (req, res) => {
    try { 
        const {id} = req.params;
        if(!id) {
            return errorResponse(res, "Warehouse Id is required", 400);
        }
        const deleteWareHouse = await WareHouseService.deleteWareHouse(id);
        if (!deleteWareHouse) return errorResponse(res, "wareHouse not found", 404);
        successResponse(res, "wareHouse deleted successfully", null, null);
    } catch (error) {
        errorResponse(res, "Error deleting wareHouse",500,error);
    }
};

const scanMultipleProductsByCode = async (req,res) => {
  try { 
    const { Product_Codes } = req.body;
   
    if (!Array.isArray(Product_Codes) || Product_Codes.length === 0) {
      return errorResponse(res, "Invalid Data Pass", 400, null);;
  }

  const result = await WareHouseService.scanMultipleProducts(Product_Codes);

  if(result.success)
  {
    return successResponse(res, "Products scanned successfully", null, null);
  }
  else
  {
    return errorResponse(res, result.message, 400, null);
  }

} catch (error) {
    errorResponse(res, "Error While Scanning  Product codes",500,error);
}
};

module.exports = { getAllWareHouses, getWareHousesByCode, createWareHouses, deleteWareHouses, scanMultipleProductsByCode};