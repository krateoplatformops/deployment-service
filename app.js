const express = require('express')
const cors = require('cors')({ origin: true, credentials: true })
const responseTime = require('response-time')
const cookieParser = require('cookie-parser')
const k8sHelpers = require('./service-library/helpers/k8s.helpers')
k8sHelpers.init()

const app = express()
app.use(cors)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(responseTime({ suffix: false, digits: 0 }))

/* Middlewares */
const callLoggerMiddleware = require('./service-library/middlewares/call-logger.middleware')
const listMiddleware = require('./service-library/middlewares/list.middleware')
const errorLoggerMiddleware = require('./service-library/middlewares/error-logger.middleware')
const cookieIdentityMiddleware = require('./service-library/middlewares/cookie-identity.middleware')

app.use(callLoggerMiddleware)
app.use(cookieIdentityMiddleware)
app.use(listMiddleware)

/* Routes */
const statusRoutes = require('./service-library/routes/status.routes')
const deploymentRoutes = require('./routes/deployment.routes')

app.use('/', statusRoutes)
app.use('/', deploymentRoutes)

app.use(errorLoggerMiddleware)

module.exports = app
