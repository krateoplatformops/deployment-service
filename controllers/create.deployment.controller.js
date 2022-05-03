const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')
const nunjucks = require('nunjucks')
const yaml = require('js-yaml')

const Deployment = mongoose.model('Deployment')
const timeHelpers = require('../helpers/time.helpers')
const uriHelpers = require('../helpers/uri.helpers')
const stringHelpers = require('../helpers/string.helpers')
const { logger } = require('../helpers/logger.helpers')

const { envConstants } = require('../constants')

router.post('/', async (req, res, next) => {
  try {
    const url = uriHelpers.concatUrl([
      envConstants.TEMPLATE_URI,
      req.body.templateId
    ])
    const template = (await axios.get(url)).data

    const parsed = uriHelpers.parse(template.url)

    // get endpoint settings
    const endpointUrl = uriHelpers.concatUrl([
      envConstants.ENDPOINT_URI,
      'domain',
      parsed.domain
    ])
    const endpoint = (await axios.get(endpointUrl)).data

    logger.debug(JSON.stringify(endpoint))

    if (!endpoint) {
      throw new Error('Unsupported domain')
    }

    let claim = null
    let package = null
    let repository = null

    switch (endpoint?.type) {
      case 'github':
        claim = await axios.get(
          uriHelpers.concatUrl([
            envConstants.GIT_URI,
            'file',
            stringHelpers.to64(template.url),
            stringHelpers.to64('defaults/claim.yaml')
          ])
        )
        package = await axios.get(
          uriHelpers.concatUrl([
            envConstants.GIT_URI,
            'file',
            stringHelpers.to64(template.url),
            stringHelpers.to64('defaults/package.yaml')
          ])
        )
        const repo = await axios.get(
          uriHelpers.concatUrl([
            envConstants.GIT_URI,
            'repository',
            stringHelpers.to64(template.url)
          ])
        )
        repository = repo.data.base
        break
      default:
        throw new Error('Unsupported domain')
    }

    logger.debug(JSON.stringify(claim.data))
    logger.debug(JSON.stringify(package.data))
    logger.debug(JSON.stringify(repo.data))

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
      domain: parsed.domain,
      schema: parsed.schema,
      apiUrl: endpoint.target
    }

    claim = nunjucks.renderString(claim.data.content, placeholder)
    package = nunjucks.renderString(package.data.content, placeholder)

    // save the doc
    const save = Deployment.create({
      claim: await yaml.load(claim),
      package: await yaml.load(package),
      owner: identity.username,
      templateId: req.body.templateId,
      createdAt: timeHelpers.currentTime(),
      repository: repository
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

router.post('/import', async (req, res, next) => {
  try {
    const claim = await axios.get(
      uriHelpers.concatUrl([
        envConstants.GIT_URI,
        'file',
        stringHelpers.to64(req.body.url),
        stringHelpers.to64('claim.yaml')
      ])
    )
    const package = await axios.get(
      uriHelpers.concatUrl([
        envConstants.GIT_URI,
        'file',
        stringHelpers.to64(req.body.url),
        stringHelpers.to64('package.yaml')
      ])
    )
    const repository = await axios.get(
      uriHelpers.concatUrl([
        envConstants.GIT_URI,
        'repository',
        stringHelpers.to64(req.body.url)
      ])
    )

    lo

    const identity = JSON.parse(req.headers.identity)

    // save the doc
    const save = Deployment.findOneAndUpdate(
      { repository: repository.data.base },
      {
        $set: {
          claim: await yaml.load(claim.data.content),
          package: await yaml.load(package.data.content),
          repository: repository.data.base,
          owner: identity.username,
          createdAt: timeHelpers.currentTime()
        }
      },
      {
        new: true,
        upsert: true
      }
    )
      .then((deployment) => {
        // TODO: must to call kube-bdrige
        // claim = claim.concat(`  transactionId: ${'transactionId'}`)
        // stringHelpers.to64(claim)
        // ...
        // post kube-bridge.krateo-system.svc /apply
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
