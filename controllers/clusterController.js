
const { successResponse, errorResponse } = require("../config/response");
const { getClusteredCustomerLocations, getAllClusters, reassignMultipleCustomersToClusters, assignTechnicianToClusterService } = require("../services/clusterService");

const getClusteredCustomers = async (req, res) => {
  try {
    const maxCustomersPerCluster = parseInt(req.query.maxCustomersPerCluster) || 15;

    const clusteredCustomers = await getClusteredCustomerLocations(maxCustomersPerCluster);

    return successResponse(res, "Customers clustered successfully", null, clusteredCustomers);
  } catch (error) {
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
    return errorResponse(res, error.message || error, 500);
  }
};

const assignTechnicianToCluster = async (req, res) => {
  try {
    const { assignments } = req.body;
    console.log("req.body", req.body)

    if (!assignments || assignments.length === 0) {
      return errorResponse(res, "Assignments array is required.", 400);
    }

    const updatedClusters = [];
    for (const { clusterNo, technicianId, day } of assignments) {
      if (clusterNo === undefined || !technicianId || !day) {
        return errorResponse(res, "clusterNo, technicianId, and day are required.", 400);
      }

      const updatedCluster = await assignTechnicianToClusterService({ clusterNo, technicianId, day });
      updatedClusters.push(updatedCluster);
    }

    return successResponse(res, "Technician and day assigned successfully", null, updatedClusters);
  } catch (error) {
    return errorResponse(res, error.message || error, 500);
  }
};



module.exports = {reassignMultipleCustomers, getClusters, getClusteredCustomers, assignTechnicianToCluster }