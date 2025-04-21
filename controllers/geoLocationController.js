const { successResponse, errorResponse } = require("../config/response");
const { storeGeoLocation, getGeoLocations } =  require("../services/geoLocationServices");

const AddGeoLocation =  async (req, res) => {
    try {
        const { customerId, geoCoordinates } = req.body;
       
           const result = await storeGeoLocation(customerId,geoCoordinates);
       
           if (!result.status) {
             return errorResponse(res, result.message, 404, null);
           }
       
           return successResponse(res, result.message, null, result.data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };

  const GetGeoLocations =  async (req, res) => {
    try {
           const result = await getGeoLocations();
       
           if (!result.status) {
             return errorResponse(res, result.message, 404, null);
           }
       
           return successResponse(res, result.message, null, result.data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };

module.exports = {AddGeoLocation, GetGeoLocations};  