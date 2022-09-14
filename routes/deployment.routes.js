const express = require('express')
const router = express.Router()

const createController = require('../controllers/create.deployment.controller')
const readController = require('../controllers/read.deployment.controller')
const deleteController = require('../controllers/delete.deployment.controller')

router.use('/', createController)
router.use('/', readController)
router.use('/', deleteController)

module.exports = router
