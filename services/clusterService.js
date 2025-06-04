const Customer = require("../models/customerModel");
const Cluster = require("../models/clusterModel.js");
const GeoLocation = require("../models/geoLocationModel.js");
const mongoose = require('mongoose');
const { getGeoLocations } = require("./geoLocationServices.js");

const distance = (coord1, coord2) => { 
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
  };
  
    const getClusteredCustomerLocations = async (maxCustomersPerCluster = 15, maxCartridgeQty = 20) => {
        try {

        const { data: customersRaw } = await getGeoLocations();

        const customers = customersRaw.map(item => ({
          _id: item.customer.id, // map `id` to `_id`
          display_name: item.customer.name,
          contact_number: item.customer.contact_number,
          cf_cartridge_qty: item.customer.cf_cartridge_qty,
          geoCoordinates: item.mainGeoCoordinates
        }));

        console.log("customers", customers);
    
        const allClusters = await Cluster.find({}).lean();
    
        // Track existing customer IDs in clusters
        const clusteredIds = new Set(allClusters.flatMap(c => c.customers.map(id => id.toString())));
    
        // Track current state of each cluster
        const existingClusterUsage = {};
        let numClusters = allClusters.length || 6;

         for (let i = 0; i < numClusters; i++) {
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
        // const numClusters = 2;
    
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
              // Create new cluster dynamically
              const newClusterNo = numClusters++;
              existingClusterUsage[newClusterNo] = {
                customers: [cust._id.toString()],
                totalCartridge: cartridge
              };
              centroids.push(coord); // Add centroid for new cluster
              assignedCustomers.push({ ...cust, cluster: newClusterNo });
              console.log(`Created new cluster ${newClusterNo} for customer ${cust._id}`);
            }
          }
    
          for (let clusterNo in existingClusterUsage) {
            clusterNo = parseInt(clusterNo);
            const usage = existingClusterUsage[clusterNo];
            const clusterData = allClusters.find(c => c.clusterNo === clusterNo);
      
            if (clusterData) {
              clusterData.customers = usage.customers;
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

const warehouseLocation = {
  lat: 23.0811482565727,
  lng: 72.49727159591127
};

const getAllClusters = async () => {
  try {
    const clusters = await Cluster.aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "customers",
          foreignField: "_id",
          as: "customers"
        }
      },
      {
        $lookup: {
          from: "geolocations",
          let: { customerId: "$customers._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$customerId", "$$customerId"]
                }
              }
            },
            {
              $group: {
                _id: "$customerId",
                geoCoordinates: { $first: "$MaingeoCoordinates" }
              }
            }
          ],
          as: "geoData"
        }
      },
      {
        $addFields: {
          customers: {
            $map: {
              input: "$customers",
              as: "cust",
              in: {
                _id: "$$cust._id",
                display_name: "$$cust.display_name",
                contact_number: "$$cust.contact_number",
                MaingeoCoordinates: "$$cust.MaingeoCoordinates",
                geoCoordinates: {
                  $let: {
                    vars: {
                      geo: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$geoData",
                              as: "g",
                              cond: { $eq: ["$$g._id", "$$cust._id"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: "$$geo.geoCoordinates"
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          clusterNo: 1,
          cartridge_qty: 1,
          customers: 1
        }
      }
    ]);

    return clusters;
  } catch (error) {
    throw new Error("Failed to fetch clusters: " + error.message);
  }
};

function haversineDistance(coord1, coord2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// function optimizeRoute(cluster, warehouse) {
//   const customers = cluster.customers.map((c) => ({
//     id: c._id,
//     name: c.display_name,
//     coord: {
//       lat: c.geoCoordinates.coordinates[1],
//       lng: c.geoCoordinates.coordinates[0],
//     },
//   }));

//   console.log(customers);
  

//   let currentLocation = warehouse;
//   const route = [];
//   const unvisited = new Set(customers);

//   while (unvisited.size > 0) {
//     let nearest = null;
//     let nearestDist = Infinity;

//     for (const customer of unvisited) {
//       const dist = haversineDistance(currentLocation, customer.coord);
//       if (dist < nearestDist) {
//         nearestDist = dist;
//         nearest = customer;
//       }
//     }

//     route.push(nearest);
//     currentLocation = nearest.coord;
//     unvisited.delete(nearest);
//   }

//   return route;
// }

function optimizeRoute(cluster, warehouse) {
  const customers = cluster.customers
    .filter(c => c.geoCoordinates && Array.isArray(c.geoCoordinates.coordinates))
    .map((c) => ({
      id: c._id,
      name: c.display_name,
      coord: {
        lat: c.geoCoordinates.coordinates[1],
        lng: c.geoCoordinates.coordinates[0],
      },
    }));

  let currentLocation = warehouse;
  const route = [];
  const unvisited = new Set(customers);

  while (unvisited.size > 0) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const customer of unvisited) {
      const dist = haversineDistance(currentLocation, customer.coord);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = customer;
      }
    }

    route.push(nearest);
    currentLocation = nearest.coord;
    unvisited.delete(nearest);
  }

  return route;
}


const fetchOptimizedRoutes = async () => {
  const clusters = await getAllClusters();
console.log(clusters);

  return clusters.map((cluster) => {
    const optimizedRoute = optimizeRoute(cluster, warehouseLocation);
    const visitSequence = [];

    let totalDistance = 0;
    let lastCoord = warehouseLocation;

    // Start from warehouse
    visitSequence.push({
      visitNumber: 0,
      customerName: "Warehouse",
      lat: warehouseLocation.lat,
      lng: warehouseLocation.lng,
      clusterId: cluster.clusterNo,
      distanceFromPrev: 0, // warehouse start point
    });

    // Route through all customers
    optimizedRoute.forEach((customer, idx) => {
      const dist = haversineDistance(lastCoord, customer.coord);
      totalDistance += dist;

      visitSequence.push({
        visitNumber: idx + 1,
        customerName: customer.name,
        lat: customer.coord.lat,
        lng: customer.coord.lng,
        clusterId: cluster.clusterNo,
        distanceFromPrev: dist,
      });

      lastCoord = customer.coord;
    });

    // Return to warehouse
    const returnDist = haversineDistance(lastCoord, warehouseLocation);
    totalDistance += returnDist;

    visitSequence.push({
      visitNumber: optimizedRoute.length + 1,
      customerName: "Return to Warehouse",
      lat: warehouseLocation.lat,
      lng: warehouseLocation.lng,
      clusterId: cluster.clusterNo,
      distanceFromPrev: returnDist,
    });

    return {
      clusterNo: cluster.clusterNo,
      cartridge_qty: cluster.cartridge_qty,
      totalDistance: totalDistance.toFixed(2), // in km, formatted
      visitSequence,
    };
  });
};




// const reassignMultipleCustomersToClusters = async (reassignments) => {
//   const bulkPullOps = reassignments.map(({ customerId }) => ({
//     updateMany: {
//       filter: { customers: customerId },
//       update: { $pull: { customers: customerId } }
//     }
//   }));

//   // Remove customers from any existing clusters
//   await Cluster.bulkWrite(bulkPullOps);

//   // Prepare a map of clusterNo => customerIds[]
//   const clusterMap = {};
//   for (const { customerId, newClusterNo } of reassignments) {
//     if (!clusterMap[newClusterNo]) clusterMap[newClusterNo] = [];
//     clusterMap[newClusterNo].push(customerId);
//   }

//   // For each clusterNo, push customers (create if not exists)
//   for (const [clusterNo, customerIds] of Object.entries(clusterMap)) {
//     const cluster = await Cluster.findOne({ clusterNo: Number(clusterNo) });
//     if (cluster) {
//       cluster.customers.push(...customerIds);
//       await cluster.save();
//     } else {
//       await Cluster.create({
//         clusterNo: Number(clusterNo),
//         customers: customerIds
//       });
//     }
//   }
// };

const reassignMultipleCustomersToClusters = async (reassignments) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const MAX_CUSTOMERS = 20;
    const MAX_CARTRIDGES = 24;

    // Step 1: Fetch all customers involved
    const customerIds = reassignments.map(r => r.customerId);
    const customers = await Customer.find({ _id: { $in: customerIds } }).session(session).lean();
    const customerMap = new Map(customers.map(c => [c._id.toString(), c]));

    // Step 2: Remove customers from any existing clusters and adjust cartridge qty
    for (const { customerId } of reassignments) {
      const customer = customerMap.get(customerId);
      const cartridgeQty = parseFloat(customer.cf_cartridge_qty) || 0;

      // Remove from any cluster where the customer exists
      const clustersWithCustomer = await Cluster.find({ customers: customerId }).session(session);

      for (const cluster of clustersWithCustomer) {
        cluster.customers.pull(customerId);
        cluster.cartridge_qty = Math.max(0, (cluster.cartridge_qty || 0) - cartridgeQty);
        await cluster.save({ session });
      }
    }

    // Step 3: Prepare new assignments grouped by cluster
    const clusterMap = {};
    for (const { customerId, newClusterNo } of reassignments) {
      if (!clusterMap[newClusterNo]) clusterMap[newClusterNo] = [];
      clusterMap[newClusterNo].push(customerId);
    }

    // Step 4: Assign to new clusters with validations
    for (const [clusterNoStr, customerIds] of Object.entries(clusterMap)) {
      const clusterNo = Number(clusterNoStr);
      const customerObjs = customerIds.map(id => customerMap.get(id));
      const totalNewCartridges = customerObjs.reduce((sum, c) => sum + (parseFloat(c.cf_cartridge_qty) || 0), 0);

      let cluster = await Cluster.findOne({ clusterNo }).session(session);

      const currentCustomerCount = cluster ? cluster.customers.length : 0;
      const currentCartridgeQty = cluster ? cluster.cartridge_qty || 0 : 0;

      if ((currentCustomerCount + customerIds.length) > MAX_CUSTOMERS) {
        throw new Error(`Cluster ${clusterNo} would exceed customer limit`);
      }

      if ((currentCartridgeQty + totalNewCartridges) > MAX_CARTRIDGES) {
        throw new Error(`Cluster ${clusterNo} would exceed cartridge limit`);
      }

      if (cluster) {
        cluster.customers.push(...customerIds);
        cluster.cartridge_qty += totalNewCartridges;
        await cluster.save({ session });
      } else {
        await Cluster.create([{
          clusterNo,
          customers: customerIds,
          cartridge_qty: totalNewCartridges
        }], { session });
      }
    }

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error.message);
  }
};



module.exports = {
    reassignMultipleCustomersToClusters,
    getAllClusters,
    getClusteredCustomerLocations,
    fetchOptimizedRoutes,
}