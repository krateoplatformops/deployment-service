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
  templateId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model(
  'Deployment',
  deploymentSchema,
  dbConstants.COLLECTION_DEPLOYMENT
)
