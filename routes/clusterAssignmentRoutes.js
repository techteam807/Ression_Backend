const express = require('express');
const router = express.Router();
const clusterAssignmentController = require('../controllers/clusterAssignmentController');
const { assignClusterValidation, getAssignmentsValidation, deleteClusterAssignment } = require('../validations/clusterAssignmentValidation');
const {validateRequest} = require('../config/validation');

// Middleware to ensure proper JSON parsing
router.use(express.json());

// Assign cluster to user
router.post('/assign', validateRequest(assignClusterValidation), clusterAssignmentController.assignCluster);

// Get live and upcoming assignments - for APP
router.get('/', validateRequest(getAssignmentsValidation, 'query'), clusterAssignmentController.getAssignments);

// Get all assignments without categorization
router.get('/all', validateRequest(getAssignmentsValidation, 'query'), clusterAssignmentController.getAllAssignments);

// Get past assignments
router.get('/past', validateRequest(getAssignmentsValidation, 'query'), clusterAssignmentController.getPastAssignments);

// Get cluster dropdown data
router.get('/clusters', clusterAssignmentController.getClusterDropdown);

//delete cluster assigmnet data
router.delete("/delete/:id",validateRequest(deleteClusterAssignment),clusterAssignmentController.deleteAssignment);

router.get('/clusterAssignmentById',clusterAssignmentController.getAssignmentsById);

module.exports = router; 