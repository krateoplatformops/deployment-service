const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const timeHelpers = require('../../helpers/time.helpers')

const Deployment = mongoose.model('Deployment')

router.post('/', async (req, res, next) => {
  try {
    Deployment.create({ ...req.body, createdAt: timeHelpers.currentTime() })
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

module.exports = router
