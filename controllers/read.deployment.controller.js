const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Deployment = mongoose.model('Deployment')
const pluginHelpers = require('../helpers/plugin.helpers')

router.get('/', async (req, res, next) => {
  try {
    Deployment.find()
      .then((deployment) => {
        res.status(200).json(deployment)
      })
      .catch((err) => {
        next(err)
      })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/plugins/:plugin/:name', async (req, res, next) => {
  pluginHelpers.processPlugin(req, res, next)
})

router.get('/:id', async (req, res, next) => {
  try {
    Deployment.findById(req.params.id).exec((error, deployment) => {
      if (error) {
        next(error)
      }
      if (!deployment) {
        res.status(404).json({
          message: `Deployment with id ${id} is not found`
        })
      } else {
        res.status(200).json(deployment)
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
