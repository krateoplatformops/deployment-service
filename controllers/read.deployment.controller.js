const express = require('express')
const router = express.Router()
const k8sHelpers = require('../service-library/helpers/k8s.helpers')
const { k8sConstants } = require('../service-library/constants')
const responseHelpers = require('../service-library/helpers/response.helpers')
const { deploymentConstants } = require('../constants')

router.get('/', async (req, res, next) => {
  try {
    const xxx = await k8sHelpers.getList(k8sConstants.deploymentApi)
    const list = xxx.filter((x) =>
      x.metadata.name.endsWith('deployment.krateo.io')
    )

    const content = await Promise.all(
      list.map(async (v) => {
        return await k8sHelpers.getList(
          `${deploymentConstants.baseApi}/${v.spec.versions[0].name}/${v.spec.names.singular}`
        )
      })
    )

    res
      .status(200)
      .json({ list: content.flat().map((t) => responseHelpers.parse(t)) })
  } catch (error) {
    next(error)
  }
})

router.get('/:kind/:uid', async (req, res, next) => {
  try {
    const d = await k8sHelpers.getSingleByUid(
      `${deploymentConstants.baseApi}/${
        deploymentConstants.version
      }/${req.params.kind.toLowerCase()}`,
      req.params.uid
    )

    res.status(200).json(responseHelpers.parse(d))
  } catch (error) {
    next(error)
  }
})

module.exports = router
