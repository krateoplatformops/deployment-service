const express = require('express')
const router = express.Router()

const createController = require('../controllers/deployment/create.deployment.controller')
const readController = require('../controllers/deployment/read.deployment.controller')

router.use('/', createController)
router.use('/', readController)

module.exports = router
