const ClusterAssignment = require("../models/ClusterAssignmentModel");
const Cluster = require("../models/clusterModel");
const { ReplacementStatusEnum } = require("../config/global");
const { default: mongoose } = require("mongoose");

function getWeek() {
  const now = new Date();

  // Convert current time to IST
  const indiaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  // Start of today in IST
  const start = new Date(indiaTime);
  start.setHours(0, 0, 0, 0);

  // End of 6 days later (7-day range)
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  // Format to YYYY-MM-DD in IST
  const formatDate = (date) => {
    const istDate = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const day = String(istDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  console.log("s:", formatDate(start), "|", "e:", formatDate(end));

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

const assignCluster = async (userIds, clusterId, date) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const indianDate = new Date(`${date}T00:00:00.000Z`);
    const assignments = [];

    for (const userId of userIds) {
      // Check if user has any other assignments on the same date
      const existingUserDateAssignment = await ClusterAssignment.findOne(
        {
          userId,
          date: {
            $gte: indianDate,
            $lt: new Date(indianDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        null,
        { session }
      );

      if (existingUserDateAssignment) {
        throw new Error("User already has an assignment for this date");
      }

      // // Check if cluster is already assigned to any user for this date
      // const existingClusterAssignment = await ClusterAssignment.findOne({
      //     clusterId,
      //     date: {
      //         $gte: indianDate,
      //         $lt: new Date(indianDate.getTime() + 24 * 60 * 60 * 1000)
      //     }
      // });

      // if (existingClusterAssignment) {
      //     throw new Error('This cluster is already assigned to another user for the selected date');
      // }

      // Create new cluster assignment
      const clusterAssignment = new ClusterAssignment({
        userId,
        clusterId,
        date: indianDate, // Store date in Indian timezone
        customerStatuses: [],
      });

      await clusterAssignment.save({ session });
      assignments.push(clusterAssignment);
    }

    await session.commitTransaction();
    session.endSession();

    return assignments;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getClusterDropdown = async (vehicleNo) => {
  try {
    const filter = {};
    if (vehicleNo) {
      filter.vehicleNo = Number(vehicleNo);
    }
    const clusters = await Cluster.find(
      filter,
      "clusterNo _id clusterName vehicleNo"
    )
      .sort({ clusterNo: 1 })
      .lean();

    return clusters;
  } catch (error) {
    console.error("Error in getClusterDropdown:", error);
    throw error;
  }
};

const getAssignments = async (filters = {}) => {
  try {
    const todayIST = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
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
        const indianStartDate = new Date(
          startDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const indianEndDate = new Date(
          endDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );

        query.date = {
          $gte: indianStartDate,
          $lte: indianEndDate,
        };
      } catch (dateError) {
        throw new Error("Invalid date format provided");
      }
    }

    // Get all assignments based on filters with complete population
    const assignments = await ClusterAssignment.find(query)
      .populate("userId", "user_name")
      .populate({
        path: "clusterId",
        populate: {
          path: "customers.customerId",
          select:
            "display_name contact_number cf_google_map_link cf_cartridge_qty cf_cartridge_size cf_detailed_address first_name last_name",
        },
      })
      .sort({ date: 1 })
      .lean();

    // Categorize assignments based on date
    const categorizedAssignments = {
      live: [],
      upcoming: [],
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
          customerStatuses.map((status) => [
            status.customerId.toString(),
            status.status,
          ])
        );

        // Add the replacement status to each customer
        if (assignment.clusterId?.customers) {
          assignment.clusterId.customers = assignment.clusterId.customers.map(
            (customer) => {
              const customerIdStr = customer.customerId?._id?.toString();

              const status = statusMap.get(customerIdStr);
              const CustomerReplaceMentStatus =
                status === "done" ? true : false;

              return {
                ...customer,
                CustomerReplaceMentStatus,
              };
            }
          );

          assignment.clusterId.customers.sort((a, b) => {
            const aIndex = a.customerId?.indexNo ?? Infinity;
            const bIndex = b.customerId?.indexNo ?? Infinity;
            return aIndex - bIndex;
          });

          const cartridgeSizeCounts = {};
          for (const customer of assignment.clusterId.customers) {
            console.log("cust:", customer);

            // const size = customer.customerId?.cf_cartridge_size || "Unknown";
            // cartridgeSizeCounts[size] = (cartridgeSizeCounts[size] || 0) + 1;

            const size = customer.customerId?.cf_cartridge_size || "Unknown";
            const qty = parseInt(customer.customerId.cf_cartridge_qty) || 0;
            cartridgeSizeCounts[size] = (cartridgeSizeCounts[size] || 0) + qty;
          }
          assignment.cartridgeSizeCounts = cartridgeSizeCounts;
        }

        const assignmentDateIST = new Date(assignment.date).toLocaleDateString(
          "en-CA",
          { timeZone: "Asia/Kolkata" }
        );
        // Explicitly check for live and upcoming dates
        if (assignmentDateIST === todayIST) {
          categorizedAssignments.live.push(assignment);
        } else if (assignmentDateIST > todayIST) {
          categorizedAssignments.upcoming.push(assignment);
        }
        // Any dates before current date will be filtered out by the initial query
      } catch (error) {
        console.error("Error processing assignment:", error);
        // Skip invalid assignments instead of failing the entire request
      }
    }

    return categorizedAssignments;
  } catch (error) {
    console.error("Error in getAssignments:", error);
    throw error;
  }
};

const getAllAssignments = async (filters = {}) => {
  try {
    // Build query based on filters
    const query = {};
    if (filters.clusterId) query.clusterId = filters.clusterId;
    if (filters.userId) query.userId = filters.userId;

    if (filters.vehicleNo) {
      const matchingClusters = await Cluster.find(
        { vehicleNo: Number(filters.vehicleNo) },
        "_id"
      ).lean();

      const clusterIds = matchingClusters.map((c) => c._id);

      // If no matching clusters, return early with empty data
      if (clusterIds.length === 0) return [];

      query.clusterId = { $in: clusterIds };
    }

    if (filters.startDate && filters.endDate) {
      try {
        const indiaTz = "Asia/Kolkata";

        const start = new Date(
          new Date(filters.startDate + "T00:00:00").toLocaleString("en-US", {
            timeZone: indiaTz,
          })
        );
        const end = new Date(
          new Date(filters.endDate + "T23:59:59").toLocaleString("en-US", {
            timeZone: indiaTz,
          })
        );

        // Convert back to UTC (Mongo stores in UTC)
        const indianStartDate = new Date(start.toISOString());
        const indianEndDate = new Date(end.toISOString());

        query.date = {
          $gte: indianStartDate,
          $lte: indianEndDate,
        };
      } catch (dateError) {
        throw new Error("Invalid date format provided");
      }
    } else {
      const { start, end } = getWeek();
      startDate = start;
      endDate = end;

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Get all assignments based on filters with complete population
    const assignments = await ClusterAssignment.find(query)
      .populate("userId", "user_name")
      .populate("clusterId", "clusterNo clusterName vehicleNo")
      .populate({
        path: "customerStatuses.customerId",
        select: "display_name cf_cartridge_qty first_name last_name",
      })
      .sort({ date: -1 })
      .lean();

    return assignments;
  } catch (error) {
    console.error("Error in getAllAssignments:", error);
    throw error;
  }
};

const getPastAssignments = async (filters = {}) => {
  try {
    // Get current date in Indian timezone
    const currentDate = new Date();
    const indianDate = new Date(
      currentDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    indianDate.setHours(0, 0, 0, 0);

    // Build query based on filters
    const query = {
      date: { $lt: indianDate }, // Only get past assignments
    };

    if (filters.clusterId) query.clusterId = filters.clusterId;
    if (filters.userId) query.userId = filters.userId;

    if (filters.startDate && filters.endDate) {
      try {
        // Convert dates to Indian timezone
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        const indianStartDate = new Date(
          startDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const indianEndDate = new Date(
          endDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );

        query.date = {
          $gte: indianStartDate,
          $lt: indianEndDate,
        };
      } catch (dateError) {
        throw new Error("Invalid date format provided");
      }
    }

    // Get past assignments with complete population
    const assignments = await ClusterAssignment.find(query)
      .populate("userId", "user_name")
      .populate("clusterId", "clusterNo")
      .sort({ date: -1 }) // Sort by date descending for past assignments
      .lean();

    return assignments;
  } catch (error) {
    console.error("Error in getPastAssignments:", error);
    throw error;
  }
};

const deleteClusterAssignmentById = async (assignmentId) => {
  const deleted = await ClusterAssignment.findByIdAndDelete(assignmentId);

  if (!deleted) {
    throw new Error("Assignment not found");
  }

  return deleted;
};

const addCustomerToAssignmentold = async (assignmentId, customerId) => {
  const updated = await ClusterAssignment.updateOne(
    {
      _id: assignmentId,
      "customerStatuses.customerId": customerId,
    },
    {
      $set: {
        "customerStatuses.$.status": ReplacementStatusEnum.DONE,
        "customerStatuses.$.updatedAt": new Date(),
      },
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
            updatedAt: new Date(),
          },
        },
      }
    );
  }
};

const addCustomerToAssignment = async (
  assignmentId,
  customerId,
  session = null
) => {
  const updateQuery = {
    _id: assignmentId,
    "customerStatuses.customerId": customerId,
  };

  const update = {
    $set: {
      "customerStatuses.$.status": ReplacementStatusEnum.DONE,
      "customerStatuses.$.updatedAt": new Date(),
    },
  };

  const options = session ? { session } : {};

  const updated = await ClusterAssignment.updateOne(
    updateQuery,
    update,
    options
  );

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
    .populate("userId", "user_name")
    .populate({
      path: "clusterId",
      populate: {
        path: "customers.customerId",
        select:
          "display_name contact_number cf_google_map_link cf_cartridge_qty first_name last_name cf_cartridge_size",
      },
    })
    .lean();

  if (!assignment) return null;

  try {
    const customerStatuses = assignment.customerStatuses || [];

    // Map of customerId => status
    const statusMap = new Map(
      customerStatuses.map((status) => [
        status.customerId.toString(),
        status.status,
      ])
    );

    // Add the replacement status to each customer
    if (assignment.clusterId?.customers) {
      assignment.clusterId.customers = assignment.clusterId.customers.map(
        (customer) => {
          const customerIdStr = customer.customerId?._id?.toString();

          const status = statusMap.get(customerIdStr);
          const CustomerReplaceMentStatus = status === "done";

          return {
            ...customer,
            CustomerReplaceMentStatus,
          };
        }
      );

      console.log(
        "assignment.clusterId?.customers:",
        assignment.clusterId?.customers
      );

      assignment.clusterId.customers.sort((a, b) => {
        const aIndex = a.indexNo ?? Infinity;
        const bIndex = b.indexNo ?? Infinity;
        return aIndex - bIndex;
      });

      const cartridgeSizeCounts = {};
      for (const customer of assignment.clusterId.customers) {
        console.log("cust:", customer);

        // const size = customer.customerId?.cf_cartridge_size || "Unknown";
        // cartridgeSizeCounts[size] = (cartridgeSizeCounts[size] || 0) + 1;

        const size = customer.customerId?.cf_cartridge_size || "Unknown";
        const qty = parseInt(customer.customerId.cf_cartridge_qty) || 0;
        cartridgeSizeCounts[size] = (cartridgeSizeCounts[size] || 0) + qty;
      }
      assignment.cartridgeSizeCounts = cartridgeSizeCounts;
    }
  } catch (error) {
    console.error("Error processing assignment:", error);
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
