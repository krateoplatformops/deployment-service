const { logger } = require('../helpers/logger.helpers')
const { pathConstants } = require('../constants')

module.exports = (req, res, next) => {
  logger.info(`${req.path} - ${req.method} - ${req.ip}`)

  if (Object.keys(req.body).length > 0) {
    logger.debug(JSON.stringify(req.body))
  }
  if (Object.keys(req.params).length > 0) {
    logger.debug(JSON.stringify(req.params))
  }
  if (Object.keys(req.query).length > 0) {
    logger.debug(JSON.stringify(req.query))
  }

  next()
}
