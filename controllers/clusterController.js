
const { successResponse, errorResponse } = require("../config/response");
const { getClusteredCustomerLocations, getAllClusters, reassignMultipleCustomersToClusters, fetchOptimizedRoutes } = require("../services/clusterService");

const getClusteredCustomers = async (req, res) => {
  try {
    const maxCustomersPerCluster = parseInt(req.query.maxCustomersPerCluster) || 2;
    const maxCartridgesPerCluster = parseFloat(req.query.maxCartridgesPerCluster) || 2;

    const clusteredCustomers = await getClusteredCustomerLocations(maxCustomersPerCluster,maxCartridgesPerCluster);

    return successResponse(res, "Customers clustered successfully", null, clusteredCustomers);
  } catch (error) {
    console.log("Hello", error.message)
    return errorResponse(res, error.message || error, 500);
  }
};

const getClusters = async (req, res) => {
  try {
    const customer_code= req.query.customer_code;

    const clusters = await getAllClusters(customer_code);

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
    const clusterNo= req.query.clusterNo;
 const result = await fetchOptimizedRoutes(Number(clusterNo));
 return successResponse(res, "Customers Routes",null, result);
  }
  catch (error)
  {
return errorResponse(res, error.message || error, 500);
  }
}; 

module.exports = {reassignMultipleCustomers, getClusters, getClusteredCustomers, optimizedRoute }