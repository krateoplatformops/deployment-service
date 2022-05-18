const express = require('express')
const router = express.Router()

const packageJson = require('../package.json')

router.get('/ping', (req, res) => {
  res.status(200).send(`Deployment Service - ${packageJson.version}`)
})

router.get('/healthz', (req, res) => {
  res.status(200).send(`Deployment Service - ${packageJson.version}`)
})

module.exports = router
