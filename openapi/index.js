const m2s = require('mongoose-to-swagger')
const mongoose = require('mongoose')

const Deployment = mongoose.model('Deployment')

const responseSchema = require('./schemas/response.schema')

const deployment = require('./paths/deployment')

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Krateo Deployment Service API',
    description: 'Deployment Seervice API for Krateo',
    version: '1.0.0',
    contact: {
      name: 'Krateo PlatformOps',
      email: 'contact@krateoplatformops.io',
      url: 'https://krateo.io'
    }
  },
  paths: {
    '/': {
      get: deployment.read,
      post: deployment.create
    },
    '/:id': {
      get: deployment.readId,
      delete: deployment.delete
    },
    '/:id/plugins/:plugin/:name': {
      get: deployment.readIdPlugins
    },
    '/import': {
      post: deployment.import
    }
  },
  components: {
    schemas: {
      Deployment: m2s(Deployment),
      Response: responseSchema
    }
  }
}
