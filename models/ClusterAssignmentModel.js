const mongoose = require('mongoose');
const { ReplacementStatusEnum } = require('../config/global'); 

const ClusterAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cluster', required: true },
  date: { type: Date, required: true },

  // array of customer-level status updates for the given cluster
  customerStatuses: [
    {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
      status: {
        type: String,
        enum: Object.values(ReplacementStatusEnum),
        default: ReplacementStatusEnum.PENDING,
      },
      notes: String,
      updatedAt: { type: Date, default: Date.now },
    }
  ]
}, { timestamps: true });

ClusterAssignmentSchema.index({ technicianId: 1, clusterId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ClusterAssignment', ClusterAssignmentSchema);
