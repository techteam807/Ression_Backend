const clusterAssignmentService = require('../services/clusterAssignmentService');

const assignCluster = async (req, res) => {
    try {
        const { userIds, clusterId, date } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds must be a non-empty array"
      });
    }
        
        const result = await clusterAssignmentService.assignCluster(userIds, clusterId, date);
        
        res.status(201).json({
            success: true,
            message: 'Cluster assigned successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in assignCluster:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error assigning cluster',
            error: error.message
        });
    }
};

const getClusterDropdown = async (req, res) => {
    try {
         const vehicleNo = req.query.vehicleNo;
        const result = await clusterAssignmentService.getClusterDropdown(vehicleNo);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getClusterDropdown:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error fetching cluster dropdown',
            error: error.message
        });
    }
};

const getAssignments = async (req, res) => {
    try {
        const filters = req.query;
        const result = await clusterAssignmentService.getAssignments(filters);
        
        // Ensure the result is properly serializable
        const sanitizedResult = {
            live: result.live || [],
            upcoming: result.upcoming || []
        };
        
        res.status(200).json({
            success: true,
            data: sanitizedResult
        });
    } catch (error) {
        console.error('Error in getAssignments:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error fetching assignments',
            error: error.message
        });
    }
};

const getAllAssignments = async (req, res) => {
    try {
        const filters = req.query;
        const result = await clusterAssignmentService.getAllAssignments(filters);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getAllAssignments:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error fetching all assignments',
            error: error.message
        });
    }
};

const getPastAssignments = async (req, res) => {
    try {
        const filters = req.query;
        const result = await clusterAssignmentService.getPastAssignments(filters);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getPastAssignments:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error fetching past assignments',
            error: error.message
        });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        // console.log(id);
        const result = await clusterAssignmentService.deleteClusterAssignmentById(id);
        res.status(200).json({ message: 'Assignment deleted successfully', deleted: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAssignmentsById = async (req, res) => {
    try 
    {   const {assignmentId} = req.query;
        const result = await clusterAssignmentService.clusterAssignmentById(assignmentId);

        res.status(200).json({
            status:true,
            message:"Get Cluster By Id",
            data: result,
        })
    }
    catch (error)
    {
    console.error('Error in getAssignmentsById:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error fetching assignment By Id',
            error: error.message
        });
    }
}

module.exports = {
    assignCluster,
    getAssignments,
    getPastAssignments,
    getAllAssignments,
    getClusterDropdown,
    deleteAssignment,
    getAssignmentsById,
}; 