const express = require('express');
const router = express.Router();
const clusterAssignmentController = require('../controllers/clusterAssignmentController');
const { assignClusterValidation, getAssignmentsValidation } = require('../validations/clusterAssignmentValidation');
const {validateRequest} = require('../config/validation');

// Middleware to ensure proper JSON parsing
router.use(express.json());

// Assign cluster to user
router.post('/assign', validateRequest(assignClusterValidation), clusterAssignmentController.assignCluster);

// Get live and upcoming assignments
router.get('/', validateRequest(getAssignmentsValidation, 'query'), clusterAssignmentController.getAssignments);

// Get past assignments
router.get('/past', validateRequest(getAssignmentsValidation, 'query'), clusterAssignmentController.getPastAssignments);

module.exports = router; 