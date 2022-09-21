const express = require('express')
const router = express.Router()
const k8sHelpers = require('../service-library/helpers/k8s.helpers')

router.delete('/', async (req, res, next) => {
  try {
    await k8sHelpers.deleteByName(
      `/apis/${req.body.apiVersion}/${req.body.kind.toLowerCase()}`,
      req.body.name.toLowerCase()
    )

    res
      .status(200)
      .json({ message: `Deployment with name ${req.body.name} deleted` })
  } catch (error) {
    next(error)
  }
})

module.exports = router
