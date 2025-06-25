const Joi = require('joi');

const assignClusterValidation = Joi.object({
    userId: Joi.string().required().messages({
        'string.empty': 'User ID is required',
        'any.required': 'User ID is required'
    }),
    clusterId: Joi.string().required().messages({
        'string.empty': 'Cluster ID is required',
        'any.required': 'Cluster ID is required'
    }),
    date: Joi.date().required().messages({
        'date.base': 'Date must be a valid date',
        'any.required': 'Date is required'
    })
});

const getAssignmentsValidation = Joi.object({
    clusterId: Joi.string().optional(),
    userId: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
        'date.min': 'End date must be after start date'
    })
});

const deleteClusterAssignment = Joi.object({
id: Joi.string().required()
})

module.exports = {
    assignClusterValidation,
    getAssignmentsValidation,
    deleteClusterAssignment,
}; 