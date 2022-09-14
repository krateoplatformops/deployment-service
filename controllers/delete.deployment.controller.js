const express = require('express')
const router = express.Router()
const k8sHelpers = require('../service-library/helpers/k8s.helpers')

router.delete('/', async (req, res, next) => {
  try {
    console.log(`/apis/${req.body.api}/${req.body.kind}`)
    await k8sHelpers.deleteByName(
      `/apis/${req.body.api}/${req.body.kind}`,
      req.body.name.toLowerCase()
    )

    res
      .status(200)
      .json({ message: `Template with name ${req.body.name} deleted` })
  } catch (error) {
    next(error)
  }
})

module.exports = router
