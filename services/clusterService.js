const Customer = require("../models/customerModel");
const Cluster = require("../models/clusterModel.js");

const distance = (coord1, coord2) => {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
  };
  
    const getClusteredCustomerLocations = async (maxCustomersPerCluster = 20, maxCartridgeQty = 24) => {
        try {
        const customers = await Customer.find({})
            .select("_id display_name contact_number geoCoordinates cf_cartridge_qty")
            .lean();
    
        const allClusters = await Cluster.find({}).lean();
    
        // Track existing customer IDs in clusters
        const clusteredIds = new Set(allClusters.flatMap(c => c.customers.map(id => id.toString())));
    
        // Track current state of each cluster
        const existingClusterUsage = {};
        for (let i = 0; i < 6; i++) {
            const clusterData = allClusters.find(c => c.clusterNo === i);
            existingClusterUsage[i] = {
            customers: clusterData ? [...clusterData.customers.map(c => c.toString())] : [],
            totalCartridge: clusterData ? clusterData.cartridge_qty || 0 : 0
            };
        }
    
        // Filter only new customers not yet in any cluster
        const newCustomers = customers.filter(cust =>
            cust.geoCoordinates &&
            Array.isArray(cust.geoCoordinates.coordinates) &&
            cust.geoCoordinates.coordinates.length === 2 &&
            !clusteredIds.has(cust._id.toString())
        );
    
        if (newCustomers.length === 0) {
            throw new Error("No new customers found");
        }
    
        const coordinates = newCustomers.map(c => c.geoCoordinates.coordinates);
        const numClusters = 6;
    
        // Step 2: Initialize centroids from first N new customers
        let centroids = coordinates.slice(0, numClusters);
        let assignments = new Array(coordinates.length).fill(-1);
        let changed = true;
        let iterations = 0;
        const MAX_ITER = 100;
    
        while (changed && iterations < MAX_ITER) {
            changed = false;
            iterations++;
    
            for (let i = 0; i < coordinates.length; i++) {
            const distances = centroids.map(c => distance(coordinates[i], c));
            const nearestCentroid = distances.indexOf(Math.min(...distances));
            if (assignments[i] !== nearestCentroid) {
                assignments[i] = nearestCentroid;
                changed = true;
            }
            }
    
            const newCentroids = new Array(numClusters).fill(0).map(() => [0, 0]);
            const counts = new Array(numClusters).fill(0);
    
            for (let i = 0; i < coordinates.length; i++) {
            const cluster = assignments[i];
            newCentroids[cluster][0] += coordinates[i][0];
            newCentroids[cluster][1] += coordinates[i][1];
            counts[cluster]++;
            }
    
            for (let j = 0; j < numClusters; j++) {
            if (counts[j] > 0) {
                newCentroids[j][0] /= counts[j];
                newCentroids[j][1] /= counts[j];
            }
            }
    
            centroids = newCentroids;
        }
    
        // Step 3: Assign customers based on closest available cluster
        const assignedCustomers = [];
    
        for (let i = 0; i < newCustomers.length; i++) {
            const cust = newCustomers[i];
            const coord = coordinates[i];
            const cartridge = parseFloat(cust.cf_cartridge_qty) || 0;
    
            const distances = centroids.map(c => distance(coord, c));
            const sortedClusters = distances
            .map((d, idx) => ({ cluster: idx, dist: d }))
            .sort((a, b) => a.dist - b.dist);
    
            let assigned = false;
    
            for (const { cluster } of sortedClusters) {
            const usage = existingClusterUsage[cluster];
            if (
                usage.customers.length < maxCustomersPerCluster &&
                usage.totalCartridge + cartridge <= maxCartridgeQty
            ) {
                usage.customers.push(cust._id.toString());
                usage.totalCartridge += cartridge;
                assignedCustomers.push({ ...cust, cluster });
                assigned = true;
                break;
            }
            }
    
            if (!assigned) {
            console.warn(`Customer ${cust._id} could not be assigned due to all clusters being full.`);
            }
        }
    
        // Step 4: Save updated clusters
        for (let clusterNo = 0; clusterNo < numClusters; clusterNo++) {
            const clusterData = allClusters.find(c => c.clusterNo === clusterNo);
            const usage = existingClusterUsage[clusterNo];
    
            if (clusterData) {
            clusterData.customers = usage.customers.map(id => id); // Replace with updated list
            clusterData.cartridge_qty = usage.totalCartridge;
            await Cluster.findByIdAndUpdate(clusterData._id, clusterData);
            } else {
            await Cluster.create({
                clusterNo,
                customers: usage.customers,
                cartridge_qty: usage.totalCartridge,
            });
            }
        }
    
        return assignedCustomers;
        } catch (error) {
        console.error("Clustering Error:", error);
        throw new Error(error.message);
        }
    };
  
const getAllClusters = async () => {
  try {
    const clusters = await Cluster.find()
      .populate("customers", "display_name contact_number geoCoordinates")
      .lean();

    return clusters;
  } catch (error) {
    throw new Error("Failed to fetch clusters: " + error.message);
  }
};

const reassignMultipleCustomersToClusters = async (reassignments) => {
  const bulkPullOps = reassignments.map(({ customerId }) => ({
    updateMany: {
      filter: { customers: customerId },
      update: { $pull: { customers: customerId } }
    }
  }));

  // Remove customers from any existing clusters
  await Cluster.bulkWrite(bulkPullOps);

  // Prepare a map of clusterNo => customerIds[]
  const clusterMap = {};
  for (const { customerId, newClusterNo } of reassignments) {
    if (!clusterMap[newClusterNo]) clusterMap[newClusterNo] = [];
    clusterMap[newClusterNo].push(customerId);
  }

  // For each clusterNo, push customers (create if not exists)
  for (const [clusterNo, customerIds] of Object.entries(clusterMap)) {
    const cluster = await Cluster.findOne({ clusterNo: Number(clusterNo) });
    if (cluster) {
      cluster.customers.push(...customerIds);
      await cluster.save();
    } else {
      await Cluster.create({
        clusterNo: Number(clusterNo),
        customers: customerIds
      });
    }
  }
};

module.exports = {
    reassignMultipleCustomersToClusters,
    getAllClusters,
    getClusteredCustomerLocations
}