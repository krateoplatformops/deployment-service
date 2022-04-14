const express = require('express')
const helmet = require('helmet')
const cors = require('cors')({ origin: true, credentials: true })
const responseTime = require('response-time')
const mongoose = require('mongoose')
const swaggerUi = require('swagger-ui-express')

const { envConstants } = require('./constants')

const app = express()
app.use(helmet())
app.use(cors)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(responseTime({ suffix: false, digits: 0 }))

/* MongoDB */
mongoose.Promise = global.Promise
mongoose.connect(envConstants.MONGODB_URI)
require('./models/deployment.model')

/* Middleware */
const callLoggerMiddleware = require('./middleware/call-logger')
const errorLoggerMiddleware = require('./middleware/error-logger')

app.use(callLoggerMiddleware)

/* OpenAPI */
// const swaggerDocument = require('./openapi')
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

/* Routes */
const baseRoutes = require('./routes/base.routes')
const deploymentRoutes = require('./routes/deployment.routes')

app.use('/', baseRoutes)
app.use('/deployment', deploymentRoutes)

app.use(errorLoggerMiddleware)

module.exports = app
