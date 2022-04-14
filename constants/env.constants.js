module.exports = {
  PORT: process.env.PORT || 8080,
  MONGODB_URI: process.env.MONGODB_URI,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  TEMPLATE_URI: process.env.TEMPLATE_URI,
  HOST_URI: process.env.HOST_URI
}
