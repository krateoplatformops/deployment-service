const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')
const yaml = require('js-yaml')

const Deployment = mongoose.model('Deployment')
const uriHelpers = require('../helpers/uri.helpers')
const stringHelpers = require('../helpers/string.helpers')
const { envConstants } = require('../constants')

router.delete('/:id', async (req, res, next) => {
  try {
    Deployment.findByIdAndDelete(req.params.id, async (err, deployment) => {
      if (err) {
        next(err)
      } else if (!deployment) {
        res.status(404).json({
          message: `Deployment with id ${req.params.id} not found and cannot be deleted`
        })
      } else {
        // call kube bridge
        await axios.delete(
          uriHelpers.concatUrl([envConstants.BRIDGE_URI, 'template']),
          {
            headers: {
              'X-Deployment-Id': deployment._id
            },
            data: {
              encoding: 'base64',
              claim: stringHelpers.to64(yaml.dump(deployment.claim)),
              package: stringHelpers.to64(yaml.dump(deployment.package))
            }
          }
        )
        // response
        res
          .status(200)
          .json({ message: `Deployment with id ${req.params.id} deleted` })
      }
    })
  } catch (error) {
    console.log(error)
    next(error)
  }
})

module.exports = router
