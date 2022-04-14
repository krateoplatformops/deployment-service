const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')
const nunjucks = require('nunjucks')
const yaml = require('js-yaml')

const Deployment = mongoose.model('Deployment')
const timeHelpers = require('../../helpers/time.helpers')
const uriHelpers = require('../../helpers/uri.helpers')
const gitHubHelpers = require('../../helpers/github.helpers')
const stringHelpers = require('../../helpers/string.helpers')

const { envConstants } = require('../../constants')

router.post('/', async (req, res, next) => {
  try {
    const url = uriHelpers.concatUrl([
      envConstants.TEMPLATE_URI,
      req.body.templateId
    ])
    const template = (await axios.get(url)).data

    const parsed = uriHelpers.parse(template.url)

    // get host settings
    const hostUrl = uriHelpers.concatUrl([
      envConstants.HOST_URI,
      '/domain/',
      parsed.domain
    ])
    const host = (await axios.get(hostUrl)).data

    if (!host) {
      throw new Error('Unsupported domain')
    }

    let claim = null
    let package = null
    let provider = null

    switch (parsed.domain) {
      case 'github.com':
        claim = await gitHubHelpers.downloadFile(
          host,
          parsed,
          'defaults/claim.yaml'
        )
        package = await gitHubHelpers.downloadFile(
          host,
          parsed,
          'defaults/package.yaml'
        )
        provider = 'github'
        break
      default:
        throw new Error('Unsupported domain')
    }

    const identity = JSON.parse(req.headers.identity)

    // placeholders
    nunjucks.configure({
      noCache: true,
      autoescape: true,
      tags: { variableStart: '${{' }
    })
    const placeholder = {
      ...req.body.metadata,
      owner: identity.username,
      provider,
      domain: parsed.domain,
      schema: parsed.schema,
      apiUrl: host.apiUrl
    }

    claim = nunjucks.renderString(claim, placeholder)
    package = nunjucks.renderString(package, placeholder)

    // save the doc
    const save = Deployment.create({
      claim: await yaml.load(claim),
      package: await yaml.load(package),
      owner: identity.username,
      templateId: req.body.templateId,
      createdAt: timeHelpers.currentTime()
    })
      .then((deployment) => {
        // TODO: must to call kube-bdrige
        // claim = claim.concat(`  transactionId: ${'transactionId'}`)
        //stringHelpers.to64(claim)
        //...
        res.status(200).json(deployment)
      })
      .catch((err) => {
        next(err)
      })
  } catch (error) {
    next(error)
  }
})

module.exports = router
