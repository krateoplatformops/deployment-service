const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.status(200).send('Deployment Service')
})

router.get('/ping', (req, res) => {
  res.status(200).send('Deployment Service')
})

module.exports = router
