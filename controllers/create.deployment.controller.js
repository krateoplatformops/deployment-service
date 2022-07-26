const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')
const Mustache = require('mustache')
const yaml = require('js-yaml')
const k8s = require('@kubernetes/client-node')

const Deployment = mongoose.model('Deployment')
const timeHelpers = require('../helpers/time.helpers')
const uriHelpers = require('../helpers/uri.helpers')
const stringHelpers = require('../helpers/string.helpers')
const { logger } = require('../helpers/logger.helpers')
const { envConstants } = require('../constants')
const k8sHelpers = require('../helpers/k8s.helpers')
const packageJson = require('../package.json')

router.post(['/', '/import'], async (req, res, next) => {
  let doc = null
  let importing = false

  if (req.path === '/import') {
    importing = true
  }

  let deploymentId = null
  try {
    let template = null
    let parsed = null
    let url = null
    let endpointName = null
    let repoFolder = ''
    let payload = null

    const identity = JSON.parse(req.headers.identity)

    if (!importing) {
      const templateUrl = uriHelpers.concatUrl([
        envConstants.TEMPLATE_URI,
        req.body.templateId
      ])
      template = (await axios.get(templateUrl)).data
      parsed = uriHelpers.parse(template.url)

      endpointName = template.endpointName

      // create empty doc if new deployment
      doc = await Deployment.create({
        claim: {},
        owner: identity.username,
        templateRepository: template.url,
        createdAt: timeHelpers.currentTime(),
        repository: 'repository',
        endpointName
      })
      deploymentId = doc._id
      url = stringHelpers.to64(template.url)
      repoFolder = 'defaults/'
    } else {
      url = stringHelpers.to64(req.body.url)
      endpointName = req.body.endpointName
    }

    // get endpoint settings
    const endpointUrl = uriHelpers.concatUrl([
      envConstants.ENDPOINT_URI,
      'name',
      endpointName
    ])
    const endpoint = (await axios.get(endpointUrl)).data

    const endpointData = stringHelpers.to64(
      JSON.stringify({
        target: endpoint.target,
        secret: endpoint.secret,
        type: endpoint.type
      })
    )
    logger.debug(JSON.stringify(endpoint))

    if (!endpoint) {
      throw new Error('Unsupported domain')
    }

    let claim = null
    let repository = null

    // get files
    claim = await axios.get(
      uriHelpers.concatUrl([
        envConstants.GIT_URI,
        'file',
        url,
        endpointData,
        stringHelpers.to64(`${repoFolder}claim.yaml`)
      ])
    )

    // get endpoint
    const ep = uriHelpers.parse(endpoint.target)

    if (req.body.repository) {
      repository = req.body.repository
    } else {
      if (!importing) {
        switch (endpoint?.type) {
          case 'github':
            repository = `${ep.schema}://${req.body.metadata.provider}/${req.body.metadata.organizationName}/${req.body.metadata.repositoryName}`
            break
          case 'bitbucket':
            repository = `${ep.schema}://${req.body.metadata.provider}/${req.body.metadata.projectName}/${req.body.metadata.repositoryName}`
            break
          default:
            throw new Error(`Unsupported endpoint type ${endpoint?.type}`)
        }
      } else {
        repository = (
          await axios.get(
            uriHelpers.concatUrl([
              envConstants.GIT_URI,
              'repository',
              endpointData,
              url
            ])
          )
        ).data.base
      }
    }

    logger.debug(JSON.stringify(claim.data))
    logger.debug(JSON.stringify(repository))

    if (!importing) {
      // placeholders
      const placeholder = {
        ...req.body.metadata,
        owner: identity.username,
        domain: parsed.domain,
        schema: parsed.schema,
        apiUrl: endpoint.target,
        deploymentId: doc._id
      }

      Mustache.escape = (text) => {
        return text
      }
      claim = Mustache.render(claim.data.content, placeholder)

      claim = yaml.load(claim)
      claim.spec._values = JSON.stringify(placeholder)

      payload = { claim, repository }
    } else {
      claim = claim.data.content

      const jsonClaim = yaml.load(claim)

      payload = {
        claim: jsonClaim,
        endpointName,
        repository,
        owner: identity.username,
        createdAt: timeHelpers.currentTime()
      }

      if (jsonClaim.metadata.labels.deploymentId) {
        payload._id = jsonClaim.metadata.labels.deploymentId
        deploymentId = jsonClaim.metadata.labels.deploymentId
      }
    }

    if (!deploymentId) {
      throw new Error('Deployment ID not found')
    }

    // save the doc
    Deployment.findByIdAndUpdate(deploymentId, payload, {
      new: true,
      upsert: true
    })
      .then(async (deployment) => {
        const kc = new k8s.KubeConfig()
        kc.loadFromDefault()
        const client = k8s.KubernetesObjectApi.makeApiClient(kc)

        // apply the deployment to cluster
        // await k8sHelpers.create(client, payload.package)
        // await k8sHelpers.wait(client, payload.package)
        await k8sHelpers.create(client, payload.claim)

        // websocket
        try {
          await axios.post(envConstants.SOCKET_URI, {
            message: importing
              ? `Deployment imported successfully: ${deployment.claim.metadata.name}`
              : `New deployment created: ${deployment.claim.metadata.name}`,
            deploymentId: deployment._id,
            source: packageJson.name,
            level: 'info',
            reason: 'new'
          })
        } catch {
          logger.debug('Cannot connect to socket-service')
        }

        res.status(200).json(deployment)
      })
      .catch(async (err) => {
        console.log(err)
        await Deployment.findByIdAndDelete(deploymentId)
        next(err)
      })
  } catch (error) {
    console.log(error)
    if (deploymentId && !importing) {
      await Deployment.findByIdAndDelete(deploymentId)
    }
    next(error)
  }
})

module.exports = router
