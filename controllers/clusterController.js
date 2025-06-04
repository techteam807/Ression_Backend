
const { successResponse, errorResponse } = require("../config/response");
const { getClusteredCustomerLocations, getAllClusters, reassignMultipleCustomersToClusters, fetchOptimizedRoutes } = require("../services/clusterService");

const getClusteredCustomers = async (req, res) => {
  try {
    const maxCustomersPerCluster = parseInt(req.query.maxCustomersPerCluster) || 20;

    const clusteredCustomers = await getClusteredCustomerLocations(maxCustomersPerCluster);

    return successResponse(res, "Customers clustered successfully", null, clusteredCustomers);
  } catch (error) {
    console.log("Hello", error.message)
    return errorResponse(res, error.message || error, 500);
  }
};

const getClusters = async (req, res) => {
  try {
    const clusters = await getAllClusters();

    return successResponse(res, "Clusters fetched successfully", null, clusters);
  } catch (error) {
    return errorResponse(res, "Failed to fetch clusters", 500, error.message || error);
  }
};

const reassignMultipleCustomers = async (req, res) => {
  try {
    const { reassignments } = req.body;

    if (!Array.isArray(reassignments)) {
      return errorResponse(res, "Reassignments array is required.", 400); 
    }

    await reassignMultipleCustomersToClusters(reassignments);
    return successResponse(res, "Customers reassigned successfully");
  } catch (error) {
    console.log("Hello", error.message)
    return errorResponse(res, error.message || error, 500);
  }
};

const optimizedRoute = async (req, res) => {
  try{
 const result = await fetchOptimizedRoutes();
 return successResponse(res, "Customers Routes",null, result);
  }
  catch (error)
  {
return errorResponse(res, error.message || error, 500);
  }
}; 

module.exports = {reassignMultipleCustomers, getClusters, getClusteredCustomers, optimizedRoute }