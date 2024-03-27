const express = require('express')
const router = express.Router()
const k8sHelpers = require('../service-library/helpers/k8s.helpers')

router.delete('/', async (req, res, next) => {
  try {

    logger.debug('<- req')
    logger.debug(JSON.stringify(req))
    logger.debug('<- req')

    logger.debug('<- res')
    logger.debug(JSON.stringify(res))
    logger.debug('<- res')

    logger.debug('<- next')
    logger.debug(JSON.stringify(next))
    logger.debug('<- next')

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
