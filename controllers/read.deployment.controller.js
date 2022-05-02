const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')

const uriHelpers = require('../helpers/uri.helpers')
const stringHelpers = require('../helpers/string.helpers')
const Deployment = mongoose.model('Deployment')
const { envConstants } = require('../constants')

router.get('/', async (req, res, next) => {
  try {
    Deployment.find()
      .then((deployment) => {
        res.status(200).json(deployment)
      })
      .catch((err) => {
        next(err)
      })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    Deployment.findById(req.params.id).exec((error, deployment) => {
      if (error) {
        next(error)
      }
      res.status(200).json(deployment)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/plugins/:plugin/:name', async (req, res, next) => {
  try {
    const d = await Deployment.findById(req.params.id).lean()

    if (!d) {
      return res.status(404).send('Not found')
    }

    const plugin = d.claim.spec.dashboard.plugins.find(
      (x) => x.name === req.params.name
    )

    if (!plugin) {
      throw new Error('Plugin not found')
    }

    let content = null

    switch (req.params.plugin) {
      case 'argocd':
        const url = new URL(
          uriHelpers.concatUrl([envConstants.ARGOCD_URI, plugin.value])
        )
        Object.keys(req.query).forEach((key) =>
          url.searchParams.append(key, req.query[key])
        )
        content = (await axios.get(url.toString())).data
        break
      case 'doc':
        content = await Promise.all(
          plugin.values.map(async (v) => {
            const call = await axios.get(
              uriHelpers.concatUrl([
                envConstants.GIT_URI,
                'file',
                stringHelpers.to64(d.repository),
                stringHelpers.to64(v)
              ])
            )
            return {
              key: v,
              value: call.data.content
            }
          })
        )
        break
      case 'pipeline':
        content = await Promise.all(
          plugin.values.map(async (v) => {
            const regex = /(?<=\[)[^\]\[]*(?=])/gm
            const scopes = v.match(regex)

            if (!scopes) {
              const call = await axios.get(
                uriHelpers.concatUrl([
                  envConstants.GIT_URI,
                  'pipeline',
                  stringHelpers.to64(d.repository),
                  stringHelpers.to64(v)
                ])
              )
              return {
                key: v,
                value: call.data.content
              }
            } else {
              const name = v.split(']')
              const call = await axios.get(
                uriHelpers.concatUrl([
                  envConstants.GIT_URI,
                  'pipeline',
                  stringHelpers.to64(uriHelpers.concatUrl(scopes)),
                  stringHelpers.to64(name[name.length - 1].trim())
                ])
              )
              return {
                key: v,
                value: call.data.content
              }
            }
          })
        )
        break
      default:
        throw new Error(`Unsupported plugin type: ${req.params.plugin}`)
    }
    res.status(200).json(content)
  } catch (error) {
    next(error)
  }
})

module.exports = router
