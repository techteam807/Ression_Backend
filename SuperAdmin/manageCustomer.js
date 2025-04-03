const Customer = require('../models/customerModel');
const  {successResponse,errorResponse} = require('../config/response');

module.exports.clearProducts = async (req,res) => {
    try{
        await Customer.updateMany({}, { $set: { products: [] } });
        return successResponse(res,"All customers' products cleared successfully",null,null);
    }  catch (error) {
        return errorResponse(res, "Error Customers' products clearing!", 500, error);
    }
};