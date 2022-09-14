const express = require('express')
const router = express.Router()
const k8sHelpers = require('../service-library/helpers/k8s.helpers')
const { k8sConstants } = require('../../service-library/constants')
// const k8s = require('@kubernetes/client-node')
// const request = require('request')

router.get('/', async (req, res, next) => {
  try {
    const xxx = await k8sHelpers.getList(k8sConstants.deploymentApi)
    const list = xxx.filter(
      (x) =>
        x.metadata.name.endsWith('templates.krateo.io') &&
        x.metadata.name !== 'templates.templates.krateo.io'
    )

    const content = await Promise.all(
      list.map(async (v) => {
        return await k8sHelpers.getList(
          `/apis/templates.krateo.io/${v.spec.versions[0].name}/${v.spec.names.singular}`
        )
      })
    )

    res.status(200).json({ list: content.flat() })
  } catch (error) {
    next(error)
  }
})

// router.get('/name/:name', async (req, res, next) => {
//   try {
//     throw new Error('Not implemented')
//   } catch (error) {
//     next(error)
//   }
// })

// router.get('/id/:id', async (req, res, next) => {
//   try {
//     throw new Error('Not implemented')
//   } catch (error) {
//     next(error)
//   }
// })

module.exports = router
