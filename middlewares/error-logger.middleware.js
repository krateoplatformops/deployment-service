const { logger } = require('../helpers/logger.helpers')

module.exports = (err, req, res, next) => {
  let message
  try {
    message = err.response.data.message
  } catch (error) {
    message = err.message
  }

  logger.error(`${req.path} - ${message}`)

  res.status(err.statusCode || 500).json({
    status: 'error',
    message
  })
}
