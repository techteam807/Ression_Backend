const express = require("express");
const ClusterController = require("../controllers/clusterController");

const router = express.Router();
router.get('/customerLocationCluster', ClusterController.getClusteredCustomers);
router.get('/clusters', ClusterController.getClusters);
router.put('/clusters/reassign-batch', ClusterController.reassignMultipleCustomers);
router.get('/clusters/optimize-routes',ClusterController.optimizedRoute)
router.put('/clusters/freeze-customer', ClusterController.clusterCustomersFreeze);

module.exports = router;