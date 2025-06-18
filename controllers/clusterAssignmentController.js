const clusterAssignmentService = require('../services/clusterAssignmentService');

const assignCluster = async (req, res) => {
    try {
        const { userId, clusterId, date } = req.body;
        
        const result = await clusterAssignmentService.assignCluster(userId, clusterId, date);
        
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
        const result = await clusterAssignmentService.getClusterDropdown();
        
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

module.exports = {
    assignCluster,
    getAssignments,
    getPastAssignments,
    getAllAssignments,
    getClusterDropdown
}; 