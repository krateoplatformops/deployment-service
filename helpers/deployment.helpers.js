const timeHelpers = require('./time.helpers')

const basePayload = ({ endpointName, url }) => {
  return {
    claim: {},
    // owner: identity.username,
    // templateRepository: template.url,
    createdAt: timeHelpers.currentTime(),
    // repository: 'repository',
    endpointName,
    url
  }
}

const createEmptyDoc = async (payload) => {
  // return (await Deployment.create(basePayload(payload))).toObject()
}

module.exports = {
  createEmptyDoc,
  basePayload
}
