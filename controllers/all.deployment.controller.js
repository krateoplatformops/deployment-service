const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')
const yaml = require('js-yaml')

const uriHelpers = require('../helpers/uri.helpers')
const stringHelpers = require('../helpers/string.helpers')
const Deployment = mongoose.model('Deployment')
const { envConstants } = require('../constants')

router.all('/:id/plugins/:plugin/:name', async (req, res, next) => {
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

    // get endpoint data if specified
    let endpoint = null
    let endpointData = null
    if (plugin.endpointName) {
      const endpointUrl = uriHelpers.concatUrl([
        envConstants.ENDPOINT_URI,
        'name',
        plugin.endpointName
      ])
      endpoint = (await axios.get(endpointUrl)).data
      endpointData = stringHelpers.to64(
        JSON.stringify({
          target: endpoint.target,
          secret: endpoint.secret,
          type: endpoint.type
        })
      )
    }

    let content = null

    switch (req.params.plugin) {
      case 'argocd':
        const url = new URL(
          uriHelpers.concatUrl([
            envConstants.ARGOCD_URI,
            endpointData,
            plugin.value
          ])
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
                endpointData,
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

            let ext = false
            if (scopes && endpoint.type === 'github') {
              ext = true
            }

            if (!ext) {
              const call = await axios.get(
                uriHelpers.concatUrl([
                  envConstants.PIPELINE_URI,
                  'pipeline',
                  stringHelpers.to64(d.repository),
                  endpointData,
                  stringHelpers.to64(v)
                ])
              )
              return {
                key: v,
                value: call.data.content
              }
            } else {
              const parsed = uriHelpers.parse(d.repository)
              const name = v.split(']')
              const call = await axios.get(
                uriHelpers.concatUrl([
                  envConstants.PIPELINE_URI,
                  'pipeline',
                  stringHelpers.to64(
                    uriHelpers.concatUrl([parsed.domain, ...scopes])
                  ),
                  endpointData,
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
      case 'kubernetes':
        const up = [
          envConstants.KUBERNETES_URI,
          'resources',
          stringHelpers.to64(plugin.value)
        ]
        if (plugin.params) {
          up.push(stringHelpers.to64(JSON.stringify(plugin.params)))
        }

        content = (await axios.get(uriHelpers.concatUrl(up))).data
        break
      case 'keptn':
        content = (
          await axios({
            method: req.method,
            url: uriHelpers.concatUrl([
              envConstants.KEPTN_URI,
              req.method === 'GET' ? 'project' : 'trigger',
              endpointData,
              stringHelpers.to64(plugin.value)
            ]) + `?identity=${req.query.identity}`,
            data: req.body
          })
        ).data
        break
      case 'codequality':
        content = (
          await axios.get(
            uriHelpers.concatUrl([
              envConstants.CODEQUALITY_URI,
              endpointData,
              stringHelpers.to64(plugin.value)
            ])
          )
        ).data
        break
      case 'capi':
        content = (
          await axios.get(
            uriHelpers.concatUrl([envConstants.CAPI_URI, req.params.id])
          )
        ).data
        content.content = yaml.load(stringHelpers.b64toAscii(content.content))
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
