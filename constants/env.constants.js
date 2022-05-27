module.exports = {
  PORT: process.env.PORT || 8080,
  MONGODB_URI: process.env.MONGODB_URI,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  TEMPLATE_URI: process.env.TEMPLATE_URI,
  ENDPOINT_URI: process.env.ENDPOINT_URI,
  GIT_URI: process.env.GIT_URI,
  ARGOCD_URI: process.env.ARGOCD_URI,
  BRIDGE_URI: process.env.BRIDGE_URI,
  KUBERNETES_URI: process.env.KUBERNETES_URI,
  KEPTN_URI: process.env.KEPTN_URI,
  CODEQUALITY_URI: process.env.CODEQUALITY_URI,
  PIPELINE_URI: process.env.PIPELINE_URI
}
