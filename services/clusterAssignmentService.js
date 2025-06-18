const ClusterAssignment = require('../models/ClusterAssignmentModel');
const Cluster = require('../models/clusterModel');

const assignCluster = async (userId, clusterId, date) => {
    try {
        // Convert date to Indian timezone for consistent comparison
        const assignmentDate = new Date(date);
        const indianDate = new Date(assignmentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        indianDate.setHours(0, 0, 0, 0);

        // Check if user has any other assignments on the same date
        const existingUserDateAssignment = await ClusterAssignment.findOne({
            userId,
            date: {
                $gte: indianDate,
                $lt: new Date(indianDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingUserDateAssignment) {
            throw new Error('User already has an assignment for this date');
        }

        // Check if cluster is already assigned to any user for this date
        const existingClusterAssignment = await ClusterAssignment.findOne({
            clusterId,
            date: {
                $gte: indianDate,
                $lt: new Date(indianDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingClusterAssignment) {
            throw new Error('This cluster is already assigned to another user for the selected date');
        }

        // Create new cluster assignment
        const clusterAssignment = new ClusterAssignment({
            userId,
            clusterId,
            date: indianDate, // Store date in Indian timezone
            customerStatuses: []
        });

        await clusterAssignment.save();
        return clusterAssignment;
    } catch (error) {
        throw error;
    }
};

const getClusterDropdown = async () => {
    try {
        const clusters = await Cluster.find({}, 'clusterNo _id')
            .sort({ clusterNo: 1 })
            .lean();

        return clusters;
    } catch (error) {
        console.error('Error in getClusterDropdown:', error);
        throw error;
    }
};

const getAssignments = async (filters = {}) => {
    try {
        // Get current date in Indian timezone
        const currentDate = new Date();
        const indianDate = new Date(currentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        indianDate.setHours(0, 0, 0, 0);

        // Build query based on filters
        const query = {};
        if (filters.clusterId) query.clusterId = filters.clusterId;
        if (filters.userId) query.userId = filters.userId;

        // Add date filter for live and upcoming
        query.date = { $gte: indianDate };

        if (filters.startDate && filters.endDate) {
            try {
                // Convert dates to Indian timezone
                const startDate = new Date(filters.startDate);
                const endDate = new Date(filters.endDate);
                const indianStartDate = new Date(startDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                const indianEndDate = new Date(endDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

                query.date = {
                    $gte: indianStartDate,
                    $lte: indianEndDate
                };
            } catch (dateError) {
                throw new Error('Invalid date format provided');
            }
        }

        // Get all assignments based on filters with complete population
        const assignments = await ClusterAssignment.find(query)
            .populate('userId', 'user_name')
           .populate({
                path: 'clusterId',
                populate: {
                    path: 'customers.customerId',
                    select: 'display_name contact_number cf_google_map_link'
                }
            })
            .sort({ date: 1 })
    .lean();

// Categorize assignments based on date
const categorizedAssignments = {
    live: [],
    upcoming: []
};

// Use for...of for better async handling if needed in future
for (const assignment of assignments) {
    try {
        // Convert assignment date to Indian timezone
        const assignmentDate = new Date(assignment.date);
        const indianAssignmentDate = new Date(assignmentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        indianAssignmentDate.setHours(0, 0, 0, 0);

        // Convert dates to ISO strings for consistent comparison
        const assignmentDateStr = indianAssignmentDate.toISOString().split('T')[0];
        const currentDateStr = indianDate.toISOString().split('T')[0];

        // Explicitly check for live and upcoming dates
        if (assignmentDateStr === currentDateStr) {
            categorizedAssignments.live.push(assignment);
        } else if (assignmentDateStr > currentDateStr) {
            categorizedAssignments.upcoming.push(assignment);
        }
        // Any dates before current date will be filtered out by the initial query
    } catch (error) {
        console.error('Error processing assignment:', error);
        // Skip invalid assignments instead of failing the entire request
    }
}

return categorizedAssignments;
    } catch (error) {
    console.error('Error in getAssignments:', error);
    throw error;
}
};

const getAllAssignments = async (filters = {}) => {
    try {
        // Build query based on filters
        const query = {};
        if (filters.clusterId) query.clusterId = filters.clusterId;
        if (filters.userId) query.userId = filters.userId;

        if (filters.startDate && filters.endDate) {
            try {
                // Convert dates to Indian timezone
                const startDate = new Date(filters.startDate);
                const endDate = new Date(filters.endDate);
                const indianStartDate = new Date(startDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                const indianEndDate = new Date(endDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

                query.date = {
                    $gte: indianStartDate,
                    $lte: indianEndDate
                };
            } catch (dateError) {
                throw new Error('Invalid date format provided');
            }
        }

        // Get all assignments based on filters with complete population
        const assignments = await ClusterAssignment.find(query)
            .populate('userId', 'user_name')
            .populate('clusterId', 'clusterNo')
            .sort({ date: 1 })
            .lean();

        return assignments;
    } catch (error) {
        console.error('Error in getAllAssignments:', error);
        throw error;
    }
};

const getPastAssignments = async (filters = {}) => {
    try {
        // Get current date in Indian timezone
        const currentDate = new Date();
        const indianDate = new Date(currentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        indianDate.setHours(0, 0, 0, 0);

        // Build query based on filters
        const query = {
            date: { $lt: indianDate } // Only get past assignments
        };

        if (filters.clusterId) query.clusterId = filters.clusterId;
        if (filters.userId) query.userId = filters.userId;

        if (filters.startDate && filters.endDate) {
            try {
                // Convert dates to Indian timezone
                const startDate = new Date(filters.startDate);
                const endDate = new Date(filters.endDate);
                const indianStartDate = new Date(startDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                const indianEndDate = new Date(endDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

                query.date = {
                    $gte: indianStartDate,
                    $lt: indianEndDate
                };
            } catch (dateError) {
                throw new Error('Invalid date format provided');
            }
        }

        // Get past assignments with complete population
        const assignments = await ClusterAssignment.find(query)
            .populate('userId', 'user_name')
            .populate('clusterId', 'clusterNo')
            .sort({ date: -1 }) // Sort by date descending for past assignments
            .lean();

        return assignments;
    } catch (error) {
        console.error('Error in getPastAssignments:', error);
        throw error;
    }
};

module.exports = {
    assignCluster,
    getAssignments,
    getPastAssignments,
    getAllAssignments,
    getClusterDropdown
}; 