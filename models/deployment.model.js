const mongoose = require('mongoose')
const Schema = mongoose.Schema

const { dbConstants } = require('../constants')

const deploymentSchema = new Schema({
  claim: {
    type: Object,
    required: true
  },
  package: {
    type: Object,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  securityIssues: {
    type: Number,
    required: true,
    default: 0
  },
  codeIssues: {
    type: Number,
    required: true,
    default: 0
  },
  codeRequests: {
    type: Number,
    required: true,
    default: 0
  },
  budget: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Number,
    required: true
  },
  repository: {
    type: String,
    required: true
  }
})

deploymentSchema.index({ repository: 1 }, { name: 'deploymentIndex' })

module.exports = mongoose.model(
  'Deployment',
  deploymentSchema,
  dbConstants.COLLECTION_DEPLOYMENT
)
