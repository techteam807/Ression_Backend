const ClusterAssignment = require('../models/ClusterAssignmentModel');
const Cluster = require('../models/clusterModel');
const { ReplacementStatusEnum } = require('../config/global');

const assignCluster = async (userId, clusterId, date) => {
    try {

        const indianDate = new Date(`${date}T00:00:00.000Z`);

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
        const clusters = await Cluster.find({}, 'clusterNo _id clusterName')
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

        const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const indianDate = new Date(`${todayIST}T00:00:00.000Z`);

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
                    select: 'display_name contact_number cf_google_map_link cf_cartridge_qty'
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
                // // Convert assignment date to Indian timezone
                // const assignmentDate = new Date(assignment.date);
                // const indianAssignmentDate = new Date(assignmentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                // indianAssignmentDate.setHours(0, 0, 0, 0);

                // // Convert dates to ISO strings for consistent comparison
                // const assignmentDateStr = indianAssignmentDate.toISOString().split('T')[0];
                // const currentDateStr = indianDate.toISOString().split('T')[0];

                const customerStatuses = assignment.customerStatuses || [];

                // Map of customerId => status
                const statusMap = new Map(
                    customerStatuses.map(status => [status.customerId.toString(), status.status])
                );

                // Add the replacement status to each customer
                if (assignment.clusterId?.customers) {
                    assignment.clusterId.customers = assignment.clusterId.customers.map(customer => {
                        const customerIdStr = customer.customerId?._id?.toString();

                        const status = statusMap.get(customerIdStr);
                        const CustomerReplaceMentStatus = status === 'done' ? true : false;

                        return {
                            ...customer,
                            CustomerReplaceMentStatus
                        };
                    });

                    assignment.clusterId.customers.sort((a, b) => {
                        const aIndex = a.customerId?.indexNo ?? Infinity;
                        const bIndex = b.customerId?.indexNo ?? Infinity;
                        return aIndex - bIndex;
                    });
                }

                const assignmentDateIST = new Date(assignment.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                // Explicitly check for live and upcoming dates
                if (assignmentDateIST === todayIST) {
                    categorizedAssignments.live.push(assignment);
                } else if (assignmentDateIST > todayIST) {
                    categorizedAssignments.upcoming.push(assignment);
                }
                // Any dates before current date will be filtered out by the initial query
            } catch (error) {
                console.error('Error processing assignment:', error);
                // Skip invalid assignments instead of failing the entire request
            }
        }

        return categorizedAssignments;
    }
    catch (error) {
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
            .populate('clusterId', 'clusterNo clusterName')
            .populate({ path: 'customerStatuses.customerId', select: 'display_name cf_cartridge_qty' })
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

const deleteClusterAssignmentById = async (assignmentId) => {
    const deleted = await ClusterAssignment.findByIdAndDelete(assignmentId);

    if (!deleted) {
        throw new Error('Assignment not found');
    }

    return deleted;
};

const addCustomerToAssignmentold = async (assignmentId, customerId) => {
    const updated = await ClusterAssignment.updateOne(
        {
            _id: assignmentId,
            'customerStatuses.customerId': customerId
        },
        {
            $set: {
                'customerStatuses.$.status': ReplacementStatusEnum.DONE,
                'customerStatuses.$.updatedAt': new Date()
            }
        }
    );

    // If nothing was modified, add new entry
    if (updated.modifiedCount === 0) {
        await ClusterAssignment.updateOne(
            { _id: assignmentId },
            {
                $push: {
                    customerStatuses: {
                        customerId,
                        status: ReplacementStatusEnum.DONE,
                        updatedAt: new Date()
                    }
                }
            }
        );
    }
};

const addCustomerToAssignment = async (assignmentId, customerId, session = null) => {
    const updateQuery = {
        _id: assignmentId,
        'customerStatuses.customerId': customerId,
    };

    const update = {
        $set: {
            'customerStatuses.$.status': ReplacementStatusEnum.DONE,
            'customerStatuses.$.updatedAt': new Date(),
        },
    };

    const options = session ? { session } : {};

    const updated = await ClusterAssignment.updateOne(updateQuery, update, options);

    if (updated.modifiedCount === 0) {
        await ClusterAssignment.updateOne(
            { _id: assignmentId },
            {
                $push: {
                    customerStatuses: {
                        customerId,
                        status: ReplacementStatusEnum.DONE,
                        updatedAt: new Date(),
                    },
                },
            },
            options
        );
    }
};

const clusterAssignmentById = async (assignmentId) => {
    const assignment = await ClusterAssignment.findById(assignmentId)
        .populate('userId', 'user_name')
        .populate({
            path: 'clusterId',
            populate: {
                path: 'customers.customerId',
                select: 'display_name contact_number cf_google_map_link cf_cartridge_qty'
            }
        })
        .lean();

    if (!assignment) return null;

    try {
        const customerStatuses = assignment.customerStatuses || [];

        // Map of customerId => status
        const statusMap = new Map(
            customerStatuses.map(status => [status.customerId.toString(), status.status])
        );

        // Add the replacement status to each customer
        if (assignment.clusterId?.customers) {
            assignment.clusterId.customers = assignment.clusterId.customers.map(customer => {
                const customerIdStr = customer.customerId?._id?.toString();

                const status = statusMap.get(customerIdStr);
                const CustomerReplaceMentStatus = status === 'done';

                return {
                    ...customer,
                    CustomerReplaceMentStatus
                };
            });

            console.log("assignment.clusterId?.customers:", assignment.clusterId?.customers);


            assignment.clusterId.customers.sort((a, b) => {
                const aIndex = a.indexNo ?? Infinity;
                const bIndex = b.indexNo ?? Infinity;
                return aIndex - bIndex;
            });

        }
    } catch (error) {
        console.error('Error processing assignment:', error);
    }

    return assignment;
};


module.exports = {
    assignCluster,
    getAssignments,
    getPastAssignments,
    getAllAssignments,
    getClusterDropdown,
    deleteClusterAssignmentById,
    addCustomerToAssignment,
    clusterAssignmentById,
}; 