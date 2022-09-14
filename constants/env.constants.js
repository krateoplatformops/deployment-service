module.exports = {
  PORT: process.env.PORT || 8080,
  MONGODB_URI: process.env.MONGODB_URI,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  GIT_URI:
    process.env.GIT_URI || `http://git-service.${process.env.NAMESPACE}.svc`,
  SECRET_URI:
    process.env.SECRET_URI ||
    `http://secret-service.${process.env.NAMESPACE}.svc`,
  NOTIFICATION_URI:
    process.env.NOTIFICATION_URI ||
    `http://notification-service.${process.env.NAMESPACE}.svc`,
  TEMPLATE_URI:
    process.env.TEMPLATE_URI ||
    `http://template-service.${process.env.NAMESPACE}.svc`,
  COOKIE_NAME: process.env.COOKIE_NAME || 'krateo-platformops',
  JWT_SECRET: process.env.JWT_SECRET || 'krateo-platformops',
  JWT_ISSUER: process.env.JWT_ISSUER || 'krateo-platformops'
}
