const Customer = require("../models/customerModel");
const Cluster = require("../models/clusterModel.js");
const GeoLocation = require("../models/geoLocationModel.js");
const mongoose = require("mongoose");
const { getGeoLocations } = require("./geoLocationServices.js");
const { default: axios } = require("axios");

const distance = (coord1, coord2) => {
  const dx = coord1[0] - coord2[0];
  const dy = coord1[1] - coord2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

const warehouseLocation = {
  lat: 23.0794,
  lng: 72.3813,
};

const warehouseLocationold = {
  lat: 23.097611148457066,
  lng: 72.5479448490399,
};

// new code
const getClusteredCustomerLocationsOld = async (
  maxCustomersPerCluster = 15,
  maxCartridgeQty = 20
) => {
  try {
    const { data: customersRaw } = await getGeoLocations();

    const customers = customersRaw.map((item) => ({
      _id: item.customer.id,
      display_name: item.customer.name,
      contact_number: item.customer.contact_number,
      cf_cartridge_qty: item.customer.cf_cartridge_qty,
      geoCoordinates: item.mainGeoCoordinates,
    }));

    console.log("cust:", customers);


    const allClusters = await Cluster.find({}).lean();

    // Track existing customer IDs
    const clusteredIds = new Set(
      allClusters.flatMap((c) =>
        c.customers.map((cObj) => cObj.customerId?.toString())
      )
    );

    // Track usage
    const existingClusterUsage = {};
    let numClusters = allClusters.length || 6;

    for (let i = 0; i < numClusters; i++) {
      const clusterData = allClusters.find((c) => c.clusterNo === i);
      existingClusterUsage[i] = {
        customers: clusterData
          ? [...clusterData.customers.map((c) => c.customerId?.toString())]
          : [],
        totalCartridge: clusterData ? clusterData.cartridge_qty || 0 : 0,
      };
    }

    // Filter only new customers
    const newCustomers = customers.filter(
      (cust) =>
        cust.geoCoordinates &&
        Array.isArray(cust.geoCoordinates.coordinates) &&
        cust.geoCoordinates.coordinates.length === 2 &&
        !clusteredIds.has(cust._id.toString())
    );

    if (newCustomers.length === 0) {
      throw new Error("No new customers found");
    }

    const coordinates = newCustomers.map((c) => c.geoCoordinates.coordinates);
    let centroids = coordinates.slice(0, numClusters);
    let assignments = new Array(coordinates.length).fill(-1);
    let changed = true;
    let iterations = 0;
    const MAX_ITER = 100;

    while (changed && iterations < MAX_ITER) {
      changed = false;
      iterations++;

      for (let i = 0; i < coordinates.length; i++) {
        const distances = centroids.map((c) => distance(coordinates[i], c));
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

    const assignedCustomers = [];

    for (let i = 0; i < newCustomers.length; i++) {
      const cust = newCustomers[i];
      const coord = coordinates[i];
      const cartridge = parseFloat(cust.cf_cartridge_qty) || 0;

      const distances = centroids.map((c) => distance(coord, c));
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
        const newClusterNo = numClusters++;
        existingClusterUsage[newClusterNo] = {
          customers: [cust._id.toString()],
          totalCartridge: cartridge,
        };
        centroids.push(coord);
        assignedCustomers.push({ ...cust, cluster: newClusterNo });
      }
    }

    for (let clusterNo in existingClusterUsage) {
      clusterNo = parseInt(clusterNo);
      const usage = existingClusterUsage[clusterNo];
      const clusterData = allClusters.find((c) => c.clusterNo === clusterNo);

      const formattedCustomers = usage.customers.map((id, index) => ({
        customerId: new mongoose.Types.ObjectId(id),
        sequenceNo: index + 1,
      }));

      if (clusterData) {
        await Cluster.findByIdAndUpdate(
          clusterData._id,
          {
            $set: {
              customers: formattedCustomers,
              cartridge_qty: usage.totalCartridge,
            },
          },
          { new: true }
        );
      } else {
        await Cluster.create({
          clusterNo,
          customers: formattedCustomers,
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

const getClusteredCustomerLocationsO = async (maxCustomersPerCluster, maxCartridgesPerCluster) => {
  try {
    const { data: customersRaw } = await getGeoLocations();

    const customers = customersRaw.map((item) => ({
      _id: item.customer.id,
      display_name: item.customer.name,
      contact_number: item.customer.contact_number,
      cf_cartridge_qty: item.customer.cf_cartridge_qty,
      geoCoordinates: item.mainGeoCoordinates,
    }));

    const allClusters = await Cluster.find({}).lean();

    const clusteredIds = new Set(
      allClusters.flatMap((c) =>
        c.customers.map((cObj) => cObj.customerId?.toString())
      )
    );

    const existingClusterUsage = {};
    const numClusters = 7; // Fixed clusters: 0 to 6

    for (let i = 0; i < numClusters; i++) {
      const clusterData = allClusters.find((c) => c.clusterNo === i);
      existingClusterUsage[i] = {
        customers: clusterData
          ? [...clusterData.customers.map((c) => c.customerId?.toString())]
          : [],
        totalCartridge: clusterData ? clusterData.cartridge_qty || 0 : 0,
      };
    }

    const fallbackCluster = 7;
    const fallbackData = allClusters.find((c) => c.clusterNo === fallbackCluster);
    existingClusterUsage[fallbackCluster] = {
      customers: fallbackData
        ? [...fallbackData.customers.map((c) => c.customerId?.toString())]
        : [],
      totalCartridge: fallbackData ? fallbackData.cartridge_qty || 0 : 0,
    };

    const newCustomers = customers.filter(
      (cust) =>
        cust.geoCoordinates &&
        Array.isArray(cust.geoCoordinates.coordinates) &&
        cust.geoCoordinates.coordinates.length === 2 &&
        !clusteredIds.has(cust._id.toString())
    );

    if (newCustomers.length === 0) {
      throw new Error("No new customers found");
    }

    const coordinates = newCustomers.map((c) => c.geoCoordinates.coordinates);

    // Ensure 7 centroids for clusters 0 to 6
    let centroids = [];
    if (coordinates.length >= 7) {
      centroids = coordinates.slice(0, 7);
    } else {
      for (let i = 0; i < 7; i++) {
        const coord = coordinates[i % coordinates.length];
        centroids.push([coord[0] + i * 0.001, coord[1] + i * 0.001]);
      }
    }

    let assignments = new Array(coordinates.length).fill(-1);
    let changed = true;
    let iterations = 0;
    const MAX_ITER = 100;

    while (changed && iterations < MAX_ITER) {
      changed = false;
      iterations++;

      for (let i = 0; i < coordinates.length; i++) {
        const distances = centroids.map((c) => distance(coordinates[i], c));
        const nearestCentroid = distances.indexOf(Math.min(...distances));
        if (assignments[i] !== nearestCentroid) {
          assignments[i] = nearestCentroid;
          changed = true;
        }
      }

      const newCentroids = new Array(7).fill(0).map(() => [0, 0]);
      const counts = new Array(7).fill(0);

      for (let i = 0; i < coordinates.length; i++) {
        const cluster = assignments[i];
        newCentroids[cluster][0] += coordinates[i][0];
        newCentroids[cluster][1] += coordinates[i][1];
        counts[cluster]++;
      }

      for (let j = 0; j < 7; j++) {
        if (counts[j] > 0) {
          newCentroids[j][0] /= counts[j];
          newCentroids[j][1] /= counts[j];
        }
      }

      centroids = newCentroids;
    }

    const assignedCustomers = [];

    for (let i = 0; i < newCustomers.length; i++) {
      const cust = newCustomers[i];
      const coord = coordinates[i];
      const cartridge = parseFloat(cust.cf_cartridge_qty) || 0;

      const sortedClusters = centroids
        .map((c, idx) => ({
          cluster: idx,
          dist: distance(coord, c),
        }))
        .filter(({ cluster }) => cluster >= 0 && cluster <= 6)
        .sort((a, b) => a.dist - b.dist);

      let assigned = false;

      for (const { cluster } of sortedClusters) {
        const usage = existingClusterUsage[cluster];

        const canAddCustomer =
          usage.customers.length < maxCustomersPerCluster &&
          usage.totalCartridge + cartridge <= maxCartridgesPerCluster;

        if (canAddCustomer) {
          usage.customers.push(cust._id.toString());
          usage.totalCartridge += cartridge;
          assignedCustomers.push({ ...cust, cluster });
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        const usage = existingClusterUsage[fallbackCluster];
        usage.customers.push(cust._id.toString());
        usage.totalCartridge += cartridge;
        assignedCustomers.push({ ...cust, cluster: fallbackCluster });
      }
    }

    // Write to DB
    for (let clusterNo in existingClusterUsage) {
      clusterNo = parseInt(clusterNo);
      const usage = existingClusterUsage[clusterNo];

      const formattedCustomers = usage.customers.map((id, index) => ({
        customerId: new mongoose.Types.ObjectId(id),
        sequenceNo: index + 1,
      }));

      const existing = await Cluster.findOne({ clusterNo });

      if (existing) {
        await Cluster.updateOne(
          { clusterNo },
          {
            $set: {
              customers: formattedCustomers,
              cartridge_qty: usage.totalCartridge,
            },
          }
        );
      } else {
        await Cluster.create({
          clusterNo,
          customers: formattedCustomers,
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

const getClusteredCustomerLocations = async (maxCustomersPerCluster, maxCartridgesPerCluster) => {
  try {
    const { data: customersRaw } = await getGeoLocations();

    const customers = customersRaw.map((item) => ({
      _id: item.customer.id,
      display_name: item.customer.name,
      contact_number: item.customer.contact_number,
      cf_cartridge_qty: item.customer.cf_cartridge_qty,
      geoCoordinates: item.mainGeoCoordinates,
    }));

    const allClusters = await Cluster.find({}).lean();

    const clusteredIds = new Set(
      allClusters.flatMap((c) =>
        c.customers.map((cObj) => cObj.customerId?.toString())
      )
    );

    const existingClusterUsage = {};
    const numClusters = 7; // Fixed clusters: 0 to 6

    for (let i = 0; i < numClusters; i++) {
      const clusterData = allClusters.find((c) => c.clusterNo === i);
      existingClusterUsage[i] = {
        customers: clusterData
          ? [...clusterData.customers.map((c) => c.customerId?.toString())]
          : [],
        totalCartridge: clusterData ? clusterData.cartridge_qty || 0 : 0,
      };
    }

    // const fallbackCluster = 7;
    // const fallbackData = allClusters.find((c) => c.clusterNo === fallbackCluster);
    // existingClusterUsage[fallbackCluster] = {
    //   customers: fallbackData
    //     ? [...fallbackData.customers.map((c) => c.customerId?.toString())]
    //     : [],
    //   totalCartridge: fallbackData ? fallbackData.cartridge_qty || 0 : 0,
    // };

    const newCustomers = customers.filter(
      (cust) =>
        cust.geoCoordinates &&
        Array.isArray(cust.geoCoordinates.coordinates) &&
        cust.geoCoordinates.coordinates.length === 2 &&
        !clusteredIds.has(cust._id.toString())
    );

    if (newCustomers.length === 0) {
      throw new Error("No new customers found");
    }

    const coordinates = newCustomers.map((c) => c.geoCoordinates.coordinates);

    // Ensure 7 centroids for clusters 0 to 6
    let centroids = [];
    if (coordinates.length >= 7) {
      centroids = coordinates.slice(0, 7);
    } else {
      for (let i = 0; i < 7; i++) {
        const coord = coordinates[i % coordinates.length];
        centroids.push([coord[0] + i * 0.001, coord[1] + i * 0.001]);
      }
    }

    let assignments = new Array(coordinates.length).fill(-1);
    let changed = true;
    let iterations = 0;
    const MAX_ITER = 100;

    while (changed && iterations < MAX_ITER) {
      changed = false;
      iterations++;

      for (let i = 0; i < coordinates.length; i++) {
        const distances = centroids.map((c) => distance(coordinates[i], c));
        const nearestCentroid = distances.indexOf(Math.min(...distances));
        if (assignments[i] !== nearestCentroid) {
          assignments[i] = nearestCentroid;
          changed = true;
        }
      }

      const newCentroids = new Array(7).fill(0).map(() => [0, 0]);
      const counts = new Array(7).fill(0);

      for (let i = 0; i < coordinates.length; i++) {
        const cluster = assignments[i];
        newCentroids[cluster][0] += coordinates[i][0];
        newCentroids[cluster][1] += coordinates[i][1];
        counts[cluster]++;
      }

      for (let j = 0; j < 7; j++) {
        if (counts[j] > 0) {
          newCentroids[j][0] /= counts[j];
          newCentroids[j][1] /= counts[j];
        }
      }

      centroids = newCentroids;
    }

    const assignedCustomers = [];

    for (let i = 0; i < newCustomers.length; i++) {
      const cust = newCustomers[i];
      const coord = coordinates[i];
      const cartridge = parseFloat(cust.cf_cartridge_qty) || 0;

      const sortedClusters = centroids
        .map((c, idx) => ({
          cluster: idx,
          dist: distance(coord, c),
        }))
        .filter(({ cluster }) => cluster >= 0 && cluster <= 6)
        .sort((a, b) => a.dist - b.dist);

      let assigned = false;

      for (const { cluster } of sortedClusters) {
        const usage = existingClusterUsage[cluster];

        const canAddCustomer =
          usage.customers.length < maxCustomersPerCluster &&
          usage.totalCartridge + cartridge <= maxCartridgesPerCluster;

        if (canAddCustomer) {
          usage.customers.push(cust._id.toString());
          usage.totalCartridge += cartridge;
          assignedCustomers.push({ ...cust, cluster });
          assigned = true;
          break;
        }
      }

      // if (!assigned) {
      //   const usage = existingClusterUsage[fallbackCluster];
      //   usage.customers.push(cust._id.toString());
      //   usage.totalCartridge += cartridge;
      //   assignedCustomers.push({ ...cust, cluster: fallbackCluster });
      // }

      if (!assigned) {
        console.warn(`Customer ${cust._id} could not be assigned to any cluster`);
      }

    }

    // Write to DB
    for (let clusterNo = 0; clusterNo < 7; clusterNo++) {
      const usage = existingClusterUsage[clusterNo];

      const formattedCustomers = usage.customers.map((id, index) => ({
        customerId: new mongoose.Types.ObjectId(id),
        sequenceNo: index + 1,
      }));

      const clusterCustomerData = usage.customers.map(id =>
        customers.find(c => c._id.toString() === id)
      );

      const totalCartridge = clusterCustomerData.reduce((sum, c) => {
        return sum + (parseFloat(c?.cf_cartridge_qty) || 0);
      }, 0);

      const existing = await Cluster.findOne({ clusterNo });

      if (existing) {
        await Cluster.updateOne(
          { clusterNo },
          {
            $set: {
              customers: formattedCustomers,
              cartridge_qty: totalCartridge,
            },
          }
        );
      } else {
        await Cluster.create({
          clusterNo,
          customers: formattedCustomers,
          cartridge_qty: totalCartridge,
        });
      }
    }

    return assignedCustomers;
  } catch (error) {
    console.error("Clustering Error:", error);
    throw new Error(error.message);
  }
};

const getAllClustersOld = async () => {
  try {
    const clusters = await Cluster.find()
      .populate("customers.customerId") // populate customer details
      .lean(); // get plain JS objects
    // console.log("All Clusters:", JSON.stringify(clusters, null, 2));


    // Step 2: For each cluster's customers, fetch geo info and merge
    for (const cluster of clusters) {
      for (const cust of cluster.customers) {
        // console.log(cluster.customers);

        if (cust.customerId) {
          const customerData = cust.customerId;
          cust.customerId = customerData._id;
          cust.name = customerData.display_name || customerData.name;
          cust.contact_number = customerData.contact_number;
          cust.cf_cartridge_qty = customerData.cf_cartridge_qty;
          const geo = await GeoLocation.findOne({
            customerId: customerData._id,
          }).lean();
          cust.geoCoordinates = geo?.MaingeoCoordinates;
        }
      }
    }

    return clusters;
  } catch (error) {
    throw new Error("Failed to fetch clusters: " + error.message);
  }
};

const getAllClusters_old = async (customer_code) => {
  try {
    const clusters = await Cluster.find()
      .populate("customers.customerId")
      .lean();

    const filteredClusters = [];

    for (const cluster of clusters) {
      const filteredCustomers = [];
      const cartridgeSizeCounts = {};
      for (const cust of cluster.customers) {
        // console.log("cart:",cust);

        // if (cust.customerId) {
        //   const customerData = cust.customerId;
        //   cust.customerId = customerData._id;
        //   cust.name = customerData.display_name || customerData.name;
        //   cust.contact_number = customerData.contact_number;
        //   cust.cf_cartridge_qty = customerData.cf_cartridge_qty;

        //   const geo = await GeoLocation.findOne({
        //     customerId: customerData._id,
        //   }).lean();

        //   cust.geoCoordinates = geo?.MaingeoCoordinates;
        // }
        if (cust.customerId) {
          const customerData = cust.customerId;
          const contactNumber = customerData.contact_number;

          if (!customer_code || contactNumber === customer_code) {
            cust.customerId = customerData._id;
            cust.name = customerData.display_name || customerData.name;
            cust.contact_number = contactNumber;
            cust.cf_cartridge_qty = customerData.cf_cartridge_qty;
            cust.cf_cartridge_size = customerData.cf_cartridge_size;

            const geo = await GeoLocation.findOne({
              customerId: customerData._id,
            }).lean();

            cust.geoCoordinates = geo?.MaingeoCoordinates;

            const size = customerData.cf_cartridge_size || "Unknown";
            cartridgeSizeCounts[size] = (cartridgeSizeCounts[size] || 0) + 1;
            filteredCustomers.push(cust);
          }
        }
      }
      cluster.customers = filteredCustomers;
      cluster.cartridgeSizeCounts = cartridgeSizeCounts;
      filteredClusters.push(cluster);
    }

    return filteredClusters;
  } catch (error) {
    throw new Error("Failed to fetch clusters: " + error.message);
  }
};

const getAllClusters = async (customer_code,vehicleNo,clusterNo) => {
  try {
    const query = {};

    if (vehicleNo) query.vehicleNo = Number(vehicleNo);
if (!isNaN(Number(clusterNo))) {
  query.clusterNo = Number(clusterNo);
}


    // Step 1: Fetch all clusters and populate customer data
    const clusters = await Cluster.find(query)
      .populate("customers.customerId")
      .lean();

      if (vehicleNo) {
      const cluster7 = await Cluster.findOne({ clusterNo: 7 })
        .populate("customers.customerId")
        .lean();
      if (cluster7) {
        clusters.push(cluster7);
      }
    }

    const filteredClusters = [];
    const allCustomerIds = [];

    // Step 2: Collect all customer IDs for GeoLocation lookup
    // for (const cluster of clusters) {
    //   for (const cust of cluster.customers) {
    //     if (cust.customerId) {
    //       allCustomerIds.push(cust.customerId._id.toString());
    //     }
    //   }
    // }

    // let totalInRequestedVehicle = 0;
    // for (const cluster of clusters) {
    //   totalInRequestedVehicle += cluster.customers.length;
    //   for (const cust of cluster.customers) {
    //     if (cust.customerId) {
    //       allCustomerIds.push(cust.customerId._id.toString());
    //     }
    //   }
    // }

    let totalInRequestedVehicle = 0;
for (const cluster of clusters) {
  if (cluster.clusterNo !== 7) { // skip cluster 7
    totalInRequestedVehicle += cluster.customers.length;
  }
  for (const cust of cluster.customers) {
    if (cust.customerId) {
      allCustomerIds.push(cust.customerId._id.toString());
    }
  }
}


    // Step 3: Bulk fetch GeoLocations
    const geoData = await GeoLocation.find({
      customerId: { $in: allCustomerIds },
    }).lean();

    const geoMap = new Map();
    for (const geo of geoData) {
      geoMap.set(geo.customerId.toString(), geo.MaingeoCoordinates);
    }

    // Step 4: Process each cluster
    for (const cluster of clusters) {
      const filteredCustomers = [];
      const cartridgeSizeCounts = {};

      for (const cust of cluster.customers) {
        if (!cust.customerId) continue;

        const customerData = cust.customerId;
        const contactNumber = customerData.contact_number;

        if (!customer_code || contactNumber === customer_code) {
          cust.customerId = customerData._id;
          cust.name = customerData.display_name || customerData.name;
          cust.contact_number = contactNumber;
          cust.cf_cartridge_qty = customerData.cf_cartridge_qty;
          cust.cf_cartridge_size = customerData.cf_cartridge_size;

          const geo = geoMap.get(customerData._id.toString());
          cust.geoCoordinates = geo || {type: "Point",
    coordinates: [Number(23.0794),Number(72.3813)]};

          const size = customerData.cf_cartridge_size || "Unknown";
          const qty = parseInt(customerData.cf_cartridge_qty) || 0;
          cartridgeSizeCounts[size] = (cartridgeSizeCounts[size] || 0) + qty;


          filteredCustomers.push(cust);
        }
      }

      filteredCustomers.sort((a, b) => {
        const aIndex = a.indexNo ?? Infinity;
        const bIndex = b.indexNo ?? Infinity;
        return aIndex - bIndex;
      });

      cluster.cartridge_qty = filteredCustomers.reduce((sum, cust) => {
        return sum + (parseInt(cust.cf_cartridge_qty) || 0);
      }, 0);

      // Add filtered data to cluster
      cluster.customers = filteredCustomers;
      cluster.cartridgeSizeCounts = cartridgeSizeCounts;

      filteredClusters.push(cluster);
    }

        const allClusters = await Cluster.find({}).lean();
    let totalInClusters = 0;
    for (const cluster of allClusters) {
      totalInClusters += cluster.customers.length;
    }
    return {
      clusters: filteredClusters,
      totalInClusters,
      totalInRequestedVehicle
    };
    // return filteredClusters;
  } catch (error) {
    throw new Error("Failed to fetch clusters: " + error.message);
  }
};

const getAllClusters1 = async (customer_code, vehicleNo) => {
  try {
    const query = {};
    if (vehicleNo) query.vehicleNo = Number(vehicleNo);

    // Step 1: Fetch clusters with populated customer data
    let clusters = await Cluster.find(query)
      .populate("customers.customerId")
      .lean();

    // Add cluster 7 if vehicleNo is provided (avoid duplicates)
    if (vehicleNo) {
      const cluster7 = await Cluster.findOne({ clusterNo: 7 })
        .populate("customers.customerId")
        .lean();
      if (cluster7 && !clusters.some(c => c._id.toString() === cluster7._id.toString())) {
        clusters.push(cluster7);
      }
    }

    // Collect all customer IDs for GeoLocation lookup
    const allCustomerIds = clusters.flatMap(cluster =>
      cluster.customers
        .filter(cust => cust.customerId)
        .map(cust => cust.customerId._id.toString())
    );

    // Step 2: Fetch all GeoLocations
    const geoData = await GeoLocation.find({
      customerId: { $in: allCustomerIds },
    }).lean();

    const geoMap = new Map();
    for (const geo of geoData) {
      geoMap.set(geo.customerId.toString(), geo.MaingeoCoordinates);
    }

    // Step 3: Process clusters
    const filteredClusters = [];
    for (const cluster of clusters) {
      const filteredCustomers = [];
      const cartridgeSizeCounts = {};

      for (const cust of cluster.customers) {
        if (!cust.customerId) continue;
        const customerData = cust.customerId;
        const contactNumber = customerData.contact_number;

        // Apply customer_code filter (if provided)
        if (!customer_code || contactNumber === customer_code) {
          // Map customer fields
          const updatedCustomer = {
            ...cust,
            customerId: customerData._id,
            name: customerData.display_name || customerData.name,
            contact_number: contactNumber,
            cf_cartridge_qty: customerData.cf_cartridge_qty,
            cf_cartridge_size: customerData.cf_cartridge_size,
            geoCoordinates: geoMap.get(customerData._id.toString()) || {type: "Point",
    coordinates: ['23.0794','72.3813']}
          };

          // Cartridge size count
          const size = customerData.cf_cartridge_size || "Unknown";
          const qty = parseInt(customerData.cf_cartridge_qty) || 0;
          cartridgeSizeCounts[size] = (cartridgeSizeCounts[size] || 0) + qty;

          filteredCustomers.push(updatedCustomer);
        }
      }

      // Sort by indexNo
      filteredCustomers.sort((a, b) => (a.indexNo ?? Infinity) - (b.indexNo ?? Infinity));

      // Cartridge quantity
      const totalQty = filteredCustomers.reduce((sum, cust) => {
        return sum + (parseInt(cust.cf_cartridge_qty) || 0);
      }, 0);

      // Push updated cluster
      filteredClusters.push({
        ...cluster,
        customers: filteredCustomers,
        cartridge_qty: totalQty,
        cartridgeSizeCounts,
      });
    }

    return filteredClusters;
  } catch (error) {
    throw new Error("Failed to fetch clusters: " + error.message);
  }
};

const reassignMultipleCustomersToClustersOld = async (reassignments) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const MAX_CUSTOMERS = 20;
    const MAX_CARTRIDGES = 24;

    const customerIds = reassignments.map((r) => r.customerId);
    const customers = await Customer.find({ _id: { $in: customerIds } })
      .session(session)
      .lean();

    const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));

    for (const { customerId } of reassignments) {
      const customer = customerMap.get(customerId);
      const cartridgeQty = parseFloat(customer.cf_cartridge_qty) || 0;

      const clustersWithCustomer = await Cluster.find({
        "customers.customerId": customerId,
      }).session(session);

      for (const cluster of clustersWithCustomer) {
        cluster.customers = cluster.customers.filter(
          (c) => c.customerId.toString() !== customerId.toString()
        );
        cluster.cartridge_qty = Math.max(
          0,
          (cluster.cartridge_qty || 0) - cartridgeQty
        );
        await cluster.save({ session });
      }
    }

    const clusterMap = {};
    for (const { customerId, newClusterNo } of reassignments) {
      if (!clusterMap[newClusterNo]) clusterMap[newClusterNo] = [];
      clusterMap[newClusterNo].push(customerId);
    }

    for (const [clusterNoStr, customerIds] of Object.entries(clusterMap)) {
      const clusterNo = Number(clusterNoStr);
      const customerObjs = customerIds.map((id) => customerMap.get(id));
      const totalNewCartridges = customerObjs.reduce(
        (sum, c) => sum + (parseFloat(c.cf_cartridge_qty) || 0),
        0
      );

      let cluster = await Cluster.findOne({ clusterNo }).session(session);

      const currentCustomerCount = cluster ? cluster.customers.length : 0;
      const currentCartridgeQty = cluster ? cluster.cartridge_qty || 0 : 0;

      if (currentCustomerCount + customerIds.length > MAX_CUSTOMERS) {
        throw new Error(`Cluster ${clusterNo} would exceed customer limit`);
      }

      if (currentCartridgeQty + totalNewCartridges > MAX_CARTRIDGES) {
        throw new Error(`Cluster ${clusterNo} would exceed cartridge limit`);
      }

      const newCustomerObjects = customerIds.map((id, idx) => ({
        customerId: new mongoose.Types.ObjectId(id),
        sequenceNo: currentCustomerCount + idx + 1,
      }));

      if (cluster) {
        cluster.customers.push(...newCustomerObjects);
        cluster.cartridge_qty += totalNewCartridges;
        await cluster.save({ session });
      } else {
        await Cluster.create(
          [
            {
              clusterNo,
              customers: newCustomerObjects,
              cartridge_qty: totalNewCartridges,
            },
          ],
          { session }
        );
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

const reassignMultipleCustomersToClusters_old = async (reassignments) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const skippedCustomers = [];

  try {
    const MAX_CUSTOMERS = 20;
    const MAX_CARTRIDGES = 24;
    const FALLBACK_CLUSTER_NO = 7;

    const customerIds = reassignments.map((r) => r.customerId);
    const customers = await Customer.find({ _id: { $in: customerIds } }).session(session).lean();
    const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));

    // 2. Recalculate cartridge_qty for all clusters after removal
    const allClusters = await Cluster.find().session(session);
    for (const cluster of allClusters) {
      const updatedCustomerIds = cluster.customers.map(c => c.customerId.toString());
      const updatedQty = updatedCustomerIds.reduce((sum, id) => {
        const c = customerMap.get(id);
        return sum + (parseFloat(c?.cf_cartridge_qty) || 0);
      }, 0);
      cluster.cartridge_qty = updatedQty;
      await cluster.save({ session });
    }

    // 3. Assign each customer individually
    for (const { customerId, newClusterNo, indexNo } of reassignments) {
      const customer = customerMap.get(customerId);

      if (!customer) {
        skippedCustomers.push(`Unknown customer ID: ${customerId}`);
        continue;
      }

      // ✅ Check GeoLocation & MaingeoCoordinates
      const geoData = await GeoLocation.findOne({ customerId }).lean();
      const hasValidGeo =
        geoData &&
        geoData.MaingeoCoordinates &&
        Array.isArray(geoData.MaingeoCoordinates.coordinates) &&
        geoData.MaingeoCoordinates.coordinates.length === 2;

      if (!hasValidGeo) {
        skippedCustomers.push(customer.display_name || `Customer ID ${customerId}`);
        continue; // Don't remove or reassign
      }

      await Cluster.updateMany(
        { "customers.customerId": new mongoose.Types.ObjectId(customerId) },
        {
          $pull: {
            customers: { customerId: new mongoose.Types.ObjectId(customerId) },
          },
        },
        { session }
      );

      const cartridgeQty = parseFloat(customer?.cf_cartridge_qty) || 0;

      let cluster = await Cluster.findOne({ clusterNo: newClusterNo }).session(session);
      let assigned = true;

      const currentCustomerCount = cluster?.customers.length || 0;
      const currentCartridgeQty = cluster?.cartridge_qty || 0;

      if (
        currentCustomerCount + 1 > MAX_CUSTOMERS ||
        currentCartridgeQty + cartridgeQty > MAX_CARTRIDGES
      ) {
        assigned = false;
        cluster = await Cluster.findOne({ clusterNo: FALLBACK_CLUSTER_NO }).session(session);

        if (!cluster) {
          // Create fallback cluster if it doesn't exist
          cluster = await Cluster.create(
            [
              {
                clusterNo: FALLBACK_CLUSTER_NO,
                clusterName: "Unassigned",
                customers: [],
                cartridge_qty: 0,
              },
            ],
            { session }
          );
          cluster = Array.isArray(cluster) ? cluster[0] : cluster;
        }
      }

      const insertAt = Math.min(indexNo ?? 0, cluster.customers.length);

      const sequenceNo = (cluster.customers?.length || 0) + 1;
      const newCustomerObj = {
        customerId: new mongoose.Types.ObjectId(customerId),
        indexNo: insertAt,
        sequenceNo,
      };

      cluster.customers.push(newCustomerObj);
      cluster.cartridge_qty += cartridgeQty;
      await cluster.save({ session });

      console.log(`Assigned to cluster ${newClusterNo}: ${assigned}`);
    }

    console.log("skip:", skippedCustomers);


    await session.commitTransaction();
    session.endSession();

    return { skippedCustomers };

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw new Error("Reassignment failed: " + err.message);
  }
};

const reassignMultipleCustomersToClusters = async (reassignments) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const skippedCustomers = [];
  const affectedClusterIds = new Set();

  try {
    // const MAX_CUSTOMERS = 20;
    // const MAX_CARTRIDGES = 24;
    // const FALLBACK_CLUSTER_NO = 7;

    const customerIds = reassignments.map((r) => r.customerId);
    const customers = await Customer.find({ _id: { $in: customerIds } }).session(session).lean();
    const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));

    // // 1. Load all clusters initially
    // const allClusters = await Cluster.find().session(session);

    // // 2. Recalculate cartridge_qty for all clusters (based on actual data)
    // for (const cluster of allClusters) {
    //   const updatedCustomerIds = cluster.customers.map((c) => c.customerId.toString());
    //   const updatedQty = updatedCustomerIds.reduce((sum, id) => {
    //     const c = customerMap.get(id);
    //     return sum + (parseFloat(c?.cf_cartridge_qty) || 0);
    //   }, 0);
    //   cluster.cartridge_qty = updatedQty;
    //   await cluster.save({ session });
    // }

    // 3. Assign each customer individually
    for (const { customerId, newClusterId, indexNo } of reassignments) {
      const customer = customerMap.get(customerId);

      if (!customer) {
        skippedCustomers.push(`Unknown customer ID: ${customerId}`);
        continue;
      }

      // // ✅ Check GeoLocation & MaingeoCoordinates
      // const geoData = await GeoLocation.findOne({ customerId }).lean();
      // const hasValidGeo =
      //   geoData &&
      //   geoData.MaingeoCoordinates &&
      //   Array.isArray(geoData.MaingeoCoordinates.coordinates) &&
      //   geoData.MaingeoCoordinates.coordinates.length === 2;

      // if (!hasValidGeo) {
      //   skippedCustomers.push(customer.display_name || `Customer ID ${customerId}`);
      //   continue; // Don't remove or reassign
      // }

      const originalClusters = await Cluster.find({ "customers.customerId": new mongoose.Types.ObjectId(customerId) }).session(session);
      for (const cluster of originalClusters) {
        affectedClusterIds.add(cluster._id.toString()); // Mark old cluster for recalculation
      }


      // ✅ Only remove if customer is valid and will be reassigned
      await Cluster.updateMany(
        { "customers.customerId": new mongoose.Types.ObjectId(customerId) },
        {
          $pull: {
            customers: { customerId: new mongoose.Types.ObjectId(customerId) },
          },
        },
        { session }
      );

      const cartridgeQty = parseFloat(customer?.cf_cartridge_qty) || 0;

      let cluster = await Cluster.findOne({ _id: newClusterId }).session(session);
      let assigned = true;

      const currentCustomerCount = cluster?.customers.length || 0;
      const currentCartridgeQty = cluster?.cartridge_qty || 0;

      // if (
      //   currentCustomerCount + 1 > MAX_CUSTOMERS ||
      //   currentCartridgeQty + cartridgeQty > MAX_CARTRIDGES
      // ) {
      //   assigned = false;

      //   // 🔄 Fallback cluster logic
      //   cluster = await Cluster.findOne({ clusterNo: FALLBACK_CLUSTER_NO }).session(session);
      //   if (!cluster) {
      //     cluster = await Cluster.create(
      //       [
      //         {
      //           clusterNo: FALLBACK_CLUSTER_NO,
      //           clusterName: "Unassigned",
      //           customers: [],
      //           cartridge_qty: 0,
      //         },
      //       ],
      //       { session }
      //     );
      //     cluster = Array.isArray(cluster) ? cluster[0] : cluster;
      //   }
      // }


      if (!cluster) {
        throw new Error(`Cluster with ClusterId ${newClusterId} not found.`);
      }

      // ✅ Final add to cluster
      const insertAt = Math.min(indexNo ?? 0, cluster.customers.length);
      const sequenceNo = (cluster.customers?.length || 0) + 1;

      const newCustomerObj = {
        customerId: new mongoose.Types.ObjectId(customerId),
        indexNo: insertAt,
        sequenceNo,
      };

      // cluster.customers.push(newCustomerObj);
      if (indexNo !== undefined && indexNo >= 0 && indexNo <= cluster.customers.length) {
  cluster.customers.splice(indexNo, 0, newCustomerObj);
} else {
  cluster.customers.push(newCustomerObj); // Default append
}

      affectedClusterIds.add(cluster._id.toString());

      await cluster.save({ session });

      console.log(`Assigned to cluster ${assigned ? newClusterId : FALLBACK_CLUSTER_NO}`);
    }

    // for (const clusterId of affectedClusterIds) {
    //   const cluster = await Cluster.findById(clusterId).session(session);
    //   if (!cluster) continue;

    //   const customerIdsInCluster = cluster.customers.map((c) => c.customerId);
    //   const customersInCluster = await Customer.find({
    //     _id: { $in: customerIdsInCluster },
    //   }).session(session).lean();

    //   cluster.cartridge_qty = customersInCluster.reduce((sum, c) => {
    //     const qty = parseFloat(c?.cf_cartridge_qty);
    //     return sum + (isNaN(qty) ? 0 : qty);
    //   }, 0);

    //   await cluster.save({ session });
    // }

    for (const clusterId of affectedClusterIds) {
  const cluster = await Cluster.findById(clusterId).session(session);
  if (!cluster) continue;

  // ✅ Reindex all customers in the cluster
  cluster.customers = cluster.customers.map((cust, i) => ({
    ...cust,
    indexNo: i,
    sequenceNo: i + 1,
  }));

  // ✅ Recalculate cartridge_qty
  const customerIdsInCluster = cluster.customers.map((c) => c.customerId);
  const customersInCluster = await Customer.find({
    _id: { $in: customerIdsInCluster },
  })
    .session(session)
    .lean();

  cluster.cartridge_qty = customersInCluster.reduce((sum, c) => {
    const qty = parseFloat(c?.cf_cartridge_qty);
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);

  await cluster.save({ session });
}


    await session.commitTransaction();
    session.endSession();

    console.log("Skipped customers:", skippedCustomers);
    return { skippedCustomers };

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw new Error("Reassignment failed: " + err.message);
  }
};


// google api
const GOOGLE_API_KEY = process.env.GOOGLE_KEY;
console.log("GOOGLE_API_KEY:", GOOGLE_API_KEY);

async function getOptimizedRouteFromGoogle(warehouse, customers) {
  console.log("customers:", customers);

  const waypoints = customers
    .map((c) => `${c.coord.lat},${c.coord.lng}`)
    .join("|");

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${warehouse.lat},${warehouse.lng}&destination=${warehouse.lat},${warehouse.lng}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_API_KEY}`;

  const response = await axios.get(url);
  console.log("response:", response);

  const data = response.data;
  console.log("Google Directions API response:", data);

  if (data.status !== "OK") {
    throw new Error(`Google Directions API error: ${data.status}`);
  }

  const order = data.routes[0].waypoint_order;
  const route = order.map((i) => customers[i]);

  return {
    route: customers,
    googleRouteData: data.routes[0],
  };
}

const fetchOptimizedRoutes = async (clusterId,vehicleNo) => {
  let  { clusters } = await getAllClusters();

if (clusterId) {
  clusters = clusters.filter((cluster) => cluster._id.toString() === clusterId.toString());
}

if (vehicleNo !== undefined && vehicleNo !== null && !isNaN(vehicleNo)) {
  clusters = clusters.filter((cluster) => cluster.vehicleNo === Number(vehicleNo));
}

if (clusterId) {
  clusters = clusters.filter((cluster) => cluster._id.toString() === clusterId.toString());
}

    if (vehicleNo !== undefined && vehicleNo !== null && !isNaN(vehicleNo)) {
    clusters = clusters.filter((cluster) => cluster.vehicleNo === Number(vehicleNo));
  }

  const results = [];

  for (const cluster of clusters) {
    let customers = cluster.customers
      .filter((c) => c.geoCoordinates && Array.isArray(c.geoCoordinates.coordinates))
      .map((c) => ({
        customerId: c.customerId?._id?.toString?.() || c.customerId.toString?.(),
        name: c.name,
        indexNo: c.indexNo,
        coord: {
          lat: c.geoCoordinates.coordinates[1],
          lng: c.geoCoordinates.coordinates[0],
        },
      }));

    customers = customers.sort((a, b) => a.indexNo - b.indexNo);

    const { route: optimizedRoute, googleRouteData } = await getOptimizedRouteFromGoogle(warehouseLocation, customers);

    const visitSequence = [];
    let totalDistance = 0;

    // Start at warehouse
    visitSequence.push({
      visitNumber: 0,
      customerName: "Warehouse",
      lat: warehouseLocation.lat,
      lng: warehouseLocation.lng,
      clusterId: cluster.clusterNo,
      distanceFromPrev: 0,
    });

    // Visit each customer based on optimized order
    const updatedCustomers = [];

    optimizedRoute.forEach((customer, idx) => {
      const leg = googleRouteData.legs[idx]; // legs[idx] is from previous to current
      const dist = leg.distance.value / 1000; // meters to km

            const indexNoMap = new Map(
  cluster.customers.map(c => [c.customerId.toString(), c.indexNo])
);

      totalDistance += dist;

      visitSequence.push({
        visitNumber: idx + 1,
        customerName: customer.name,
        lat: customer.coord.lat,
        lng: customer.coord.lng,
        clusterId: cluster.clusterNo,
        distanceFromPrev: dist,
      });

      updatedCustomers.push({
        customerId: new mongoose.Types.ObjectId(customer.customerId),
        sequenceNo: idx + 1,
        indexNo: indexNoMap.get(customer.customerId.toString()),
      });
    });

    // Return to warehouse
    const returnLeg = googleRouteData.legs[googleRouteData.legs.length - 1];
    const returnDist = returnLeg.distance.value / 1000;
    totalDistance += returnDist;

    visitSequence.push({
      visitNumber: optimizedRoute.length + 1,
      customerName: "Return to Warehouse",
      lat: warehouseLocation.lat,
      lng: warehouseLocation.lng,
      clusterId: cluster.clusterNo,
      distanceFromPrev: returnDist,
    });

    // Update cluster in DB
    const newQty = cluster.customers.reduce(
      (sum, c) => sum + (parseFloat(c.cf_cartridge_qty) || 0),
      0
    );
    await Cluster.updateOne(
      { _id: cluster._id },
      { $set: { customers: updatedCustomers, cartridge_qty: newQty } }
    );

    results.push({
      clusterId:cluster._id,
      clusterNo: cluster.clusterNo,
      cartridge_qty: newQty,
      totalDistance: totalDistance.toFixed(2),
      visitSequence,
    });
  }

  return results;
};

module.exports = {
  reassignMultipleCustomersToClusters,
  getAllClusters,
  getClusteredCustomerLocations,
  fetchOptimizedRoutes,
};
