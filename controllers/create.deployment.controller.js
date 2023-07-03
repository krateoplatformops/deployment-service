const express = require('express')
const router = express.Router()
const axios = require('axios')
const Mustache = require('mustache')
const yaml = require('js-yaml')
const k8s = require('@kubernetes/client-node')

const uriHelpers = require('../service-library/helpers/uri.helpers')
const stringHelpers = require('../service-library/helpers/string.helpers')
const logger = require('../service-library/helpers/logger.helpers')
const { envConstants } = require('../service-library/constants')
const k8sHelpers = require('../service-library/helpers/k8s.helpers')
const responseHelpers = require('../service-library/helpers/response.helpers')
const { deploymentConstants } = require('../constants')
const secretHelpers = require('../service-library/helpers/secret.helpers')

router.post('/', async (req, res, next) => {
  try {
    const { templateId, metadata, deploymentId } = req.body

    const t = await axios.get(
      uriHelpers.concatUrl([envConstants.TEMPLATE_URI, 'uid', templateId])
    )

    logger.debug('t.data.spec=' + t.data.spec)

    // find fields with type = endpoint
    const endpoints = t.data.spec.widgets
      .map((w) =>
        w.properties.filter((f) => f.type?.toLowerCase() === 'endpoint')
      )
      .flat()

    logger.debug('endpoints= ' + endpoints)

    const endpointValues = await Promise.all(
      endpoints.map(async (e) => {
        return {
          [e.key]: (
            await axios.get(
              uriHelpers.concatUrl([
                envConstants.SECRET_URI,
                'endpoint',
                req.body.metadata[e.key]
              ])
            )
          ).data
        }
      })
    )

    const tUrl = t.data.spec.url
    const { pathList } = uriHelpers.parse(tUrl)
    const endpointName = t.data.spec.endpointName
    const endpoint = await secretHelpers.getEndpoint(endpointName)

    logger.debug('endpoint before switch=', endpoint)

    let path = null
    switch (endpoint.metadata.type) {
      case 'github':
        path = [pathList[0], pathList[1]]
        break
      case 'bitbucket':
        path = [pathList[1], pathList[3]]
        break
      case 'azuredevops':
        path = [pathList[0], pathList[1], pathList[3].split('?')[0]]
        break
      default:
        throw new Error(`Unsupported endpoint ${endpointName}`)
    }

    const claimContent = await axios.get(
      uriHelpers.concatUrl([
        envConstants.GIT_URI,
        endpointName,
        `${encodeURIComponent('[' + path.join('][') + ']')}deployment.yaml`
      ])
    )

    logger.debug(claimContent)

    Mustache.escape = (text) => {
      return text
    }

    const claimString = stringHelpers.b64toAscii(
      claimContent.data.list[0].content
    )

    const placeholder = {
      ...metadata,
      ...t.data.spec.defaults,
      ...endpointValues.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    }

    // functions
    placeholder.lower = () => {
      return (text, render) => {
        return render(text).toLowerCase()
      }
    }
    placeholder.upper = () => {
      return (text, render) => {
        return render(text).toUpperCase()
      }
    }
    placeholder.nospaces = () => {
      return (text, render) => {
        return render(text).replace(/\s/g, '')
      }
    }
    placeholder.spacedash = () => {
      return (text, render) => {
        return render(text).replace(/\s/g, '-')
      }
    }
    placeholder.norm = () => {
      return (text, render) => {
        return render(text)
          .replace(/\s{2,}/g, '-')
          .toLowerCase()
          .replace(/[^A-Za-z0-9-]/g, '')
          .replace(/[-\s]*$/, '')
      }
    }

    logger.debug('Pre-parsing')
    logger.debug(claimString)
    logger.debug(placeholder)
    // pre-parsing
    // const values = yaml.load(Mustache.render(claimString, placeholder)).spec
    //   .values
    // const newValues = {
    //   ...placeholder,
    //   ...Object.fromEntries(
    //     Object.entries(values).filter(([_, v]) => v != null)
    //   )
    // }
    // logger.debug(newValues)

    const claim = yaml.load(Mustache.render(claimString, placeholder))

    logger.debug(claim)

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const client = k8s.KubernetesObjectApi.makeApiClient(kc)

    let doc = null
    if (!deploymentId) {
      doc = await k8sHelpers.create(client, claim)
    } else {
      console.log('update')

      const oldClaim = await k8sHelpers.getSingleByUid(
        `${deploymentConstants.baseApi}/${
          deploymentConstants.version
        }/${claim.kind.toLowerCase()}`,
        deploymentId
      )

      doc = await k8sHelpers.patch(
        `${deploymentConstants.baseApi}/${
          deploymentConstants.version
        }/${claim.kind.toLowerCase()}`,
        oldClaim.metadata.name,
        claim.spec
      )
    }
    if (doc.statusCode && doc.statusCode !== 200) {
      return res.status(doc.statusCode).json({ message: doc.body.message })
    } else if (doc instanceof Error) {
      return res.status(500).json({ message: doc.message })
    }

    res.status(doc.statusCode || 200).json(responseHelpers.parse(doc))
    // res.status(500).json({ message: 'dev' })
  } catch (error) {
    next(error)
  }
})

// router.post('/', async (req, res, next) => {
//   let deploymentId = null
//   let claim = null
//   let doc = null
//   let importing = false
//   let payload = null

//   try {
//     if (req.body.url) {
//       importing = true

//       const { pathList } = uriHelpers.parse(req.body.url)

//       const claimPayload = {
//         ...req.body,
//         org: pathList[0],
//         repo: pathList[1],
//         fileName: pathList[pathList.length - 1]
//       }

//       // get claim
//       const claimContent = await gitHelpers.getFile(claimPayload)
//       if (!claimContent) {
//         return res.status(404).send({ message: 'File not found' })
//       }
//       logger.debug(claimContent)
//       claim = yaml.load(claimContent)

//       payload = {
//         ...deploymentHelpers.basePayload(req.body),
//         claim
//       }

//       if (claim.metadata?.labels?.deploymentId) {
//         deploymentId = claim.metadata.labels.deploymentId
//       } else {
//         doc = await deploymentHelpers.createEmptyDoc(req.body)
//         deploymentId = doc._id.toString()
//         payload.claim = {
//           ...payload.claim,
//           metadata: {
//             ...payload.claim.metadata,
//             labels: {
//               ...payload.claim.metadata.labels,
//               deploymentId: doc._id.toString()
//             }
//           }
//         }
//       }
//     } else {
//       // get template
//       const template = await templateHelpers.getTemplate(req.body.templateId)
//       if (!template) {
//         return res.status(404).send({ message: 'Template not found' })
//       }

//       // get claim
//       const claim = await gitHelpers.getFile({
//         endpointName: template.endpointName,
//         org: template.organizationName,
//         repo: template.repositoryName,
//         fileName: 'defaults/claim.yaml'
//       })

//       const endpoint = await endpointHelpers.

//       // set url
//       let url = null
//       switch (endpoint.metadata.type) {
//         case 'github':
//           url = `https://${req.body.metadata.provider}/${req.body.metadata.organizationName}/${req.body.metadata.repositoryName}`
//           break
//         case 'bitbucket':
//           url = `https://${req.body.metadata.provider}/${req.body.metadata.projectName}/${req.body.metadata.repositoryName}`
//           break
//         default:
//           throw new Error(`Unsupported endpoint type ${endpoint.metadata.type}`)
//       }

//       // empty doc
//       doc = await deploymentHelpers.createEmptyDoc({
//         endpointName: template.endpointName,
//         url
//       })

//       deploymentId = doc._id.toString()
//       const identity = res.locals.identity
//       const parsed = uriHelpers.parse(template.target)

//       // placeholders
//       const placeholder = {
//         ...req.body.metadata,
//         owner: identity.username,
//         domain: parsed.domain,
//         schema: parsed.schema,
//         apiUrl: endpoint.target,
//         deploymentId
//       }
//       Mustache.escape = (text) => {
//         return text
//       }
//       claim = Mustache.render(claim, placeholder)
//       claim = yaml.load(claim)

//       return res.status(200).json(claim)

//       // // set repository url
//       // switch (endpoint.metadata.type) {
//       //   case 'github':
//       //     repository = `${ep.schema}://${req.body.metadata.provider}/${req.body.metadata.organizationName}/${req.body.metadata.repositoryName}`
//       //     break
//       //   case 'bitbucket':
//       //     repository = `${ep.schema}://${req.body.metadata.provider}/${req.body.metadata.projectName}/${req.body.metadata.repositoryName}`
//       //     break
//       //   default:
//       //     throw new Error(`Unsupported endpoint type ${endpoint?.type}`)
//       // }

//       return res.status(200).json({ message: 'dev' })
//     }

//     // return res.status(200).json({ message: 'dev' })

//     // create empty doc if no deploymentId
//     // if (!deploymentId) {
//     //   doc = await Deployment.create({
//     //     claim: {},
//     //     owner: identity.username,
//     //     templateRepository: template.url,
//     //     createdAt: timeHelpers.currentTime(),
//     //     repository: 'repository',
//     //     endpointName
//     //   })
//     // }

//     // let doc = null
//     // let importing = false
//     // if (req.path === '/import') {
//     //   importing = true
//     // }
//     // let deploymentId = null
//     //   let template = null
//     //   let parsed = null
//     //   let url = null
//     //   let endpointName = null
//     //   let repoFolder = ''
//     //   let payload = null
//     //   const identity = JSON.parse(req.headers.identity)
//     //   if (!importing) {
//     //     const templateUrl = uriHelpers.concatUrl([
//     //       envConstants.TEMPLATE_URI,
//     //       req.body.templateId
//     //     ])
//     //     template = (await axios.get(templateUrl)).data
//     //     parsed = uriHelpers.parse(template.url)
//     //     endpointName = template.endpointName
//     //     // create empty doc if new deployment
//     //     doc = await Deployment.create({
//     //       claim: {},
//     //       owner: identity.username,
//     //       templateRepository: template.url,
//     //       createdAt: timeHelpers.currentTime(),
//     //       repository: 'repository',
//     //       endpointName
//     //     })
//     //     deploymentId = doc._id
//     //     url = stringHelpers.to64(template.url)
//     //     repoFolder = 'defaults/'
//     //   } else {
//     //     url = stringHelpers.to64(req.body.url)
//     //     endpointName = req.body.endpointName
//     //   }
//     //   // get endpoint settings
//     //   const endpointUrl = uriHelpers.concatUrl([
//     //     envConstants.ENDPOINT_URI,
//     //     'name',
//     //     endpointName
//     //   ])
//     //   const endpoint = (await axios.get(endpointUrl)).data
//     //   const endpointData = stringHelpers.to64(
//     //     JSON.stringify({
//     //       target: endpoint.target,
//     //       secret: endpoint.secret,
//     //       type: endpoint.type
//     //     })
//     //   )
//     //   logger.debug(JSON.stringify(endpoint))
//     //   if (!endpoint) {
//     //     throw new Error('Unsupported domain')
//     //   }
//     //   let claim = null
//     //   let repository = null
//     //   // get files
//     //   claim = await axios.get(
//     //     uriHelpers.concatUrl([
//     //       envConstants.GIT_URI,
//     //       'file',
//     //       url,
//     //       endpointData,
//     //       stringHelpers.to64(`${repoFolder}claim.yaml`)
//     //     ])
//     //   )
//     //   // get endpoint
//     //   const ep = uriHelpers.parse(endpoint.target)
//     //   if (req.body.metadata?.repository) {
//     //     repository = req.body.metadata.repository
//     //   } else {
//     //     if (!importing) {
//     //       switch (endpoint?.type) {
//     //         case 'github':
//     //           repository = `${ep.schema}://${req.body.metadata.provider}/${req.body.metadata.organizationName}/${req.body.metadata.repositoryName}`
//     //           break
//     //         case 'bitbucket':
//     //           repository = `${ep.schema}://${req.body.metadata.provider}/${req.body.metadata.projectName}/${req.body.metadata.repositoryName}`
//     //           break
//     //         default:
//     //           throw new Error(`Unsupported endpoint type ${endpoint?.type}`)
//     //       }
//     //     } else {
//     //       repository = (
//     //         await axios.get(
//     //           uriHelpers.concatUrl([
//     //             envConstants.GIT_URI,
//     //             'repository',
//     //             endpointData,
//     //             url
//     //           ])
//     //         )
//     //       ).data.base
//     //     }
//     //   }
//     //   logger.debug(JSON.stringify(claim.data))
//     //   logger.debug(JSON.stringify(repository))
//     //   if (!importing) {
//     //     // placeholders
//     //     const placeholder = {
//     //       ...req.body.metadata,
//     //       owner: identity.username,
//     //       domain: parsed.domain,
//     //       schema: parsed.schema,
//     //       apiUrl: endpoint.target,
//     //       deploymentId: doc._id
//     //     }
//     //     Mustache.escape = (text) => {
//     //       return text
//     //     }
//     //     claim = Mustache.render(claim.data.content, placeholder)
//     //     claim = yaml.load(claim)
//     //     claim.spec._values = JSON.stringify(placeholder)
//     //     payload = { claim, repository }
//     //   } else {
//     //     claim = claim.data.content
//     //     const jsonClaim = yaml.load(claim)
//     //     payload = {
//     //       claim: jsonClaim,
//     //       endpointName,
//     //       repository,
//     //       owner: identity.username,
//     //       createdAt: timeHelpers.currentTime()
//     //     }
//     //     if (jsonClaim.metadata.labels.deploymentId) {
//     //       payload._id = jsonClaim.metadata.labels.deploymentId
//     //       deploymentId = jsonClaim.metadata.labels.deploymentId
//     //     }
//     //   }
//     //   if (!deploymentId) {
//     //     throw new Error('Deployment ID not found')
//     //   }
//     // save the doc
//     console.log(deploymentId)
//     Deployment.findByIdAndUpdate(deploymentId, payload, {
//       new: true,
//       upsert: true
//     })
//       .then(async (deployment) => {
//         const kc = new k8s.KubeConfig()
//         kc.loadFromDefault()
//         const client = k8s.KubernetesObjectApi.makeApiClient(kc)
//         // apply the deployment to cluster
//         await k8sHelpers.create(client, payload.claim)
//         // notification service
//         try {
//           await axios.post(envConstants.NOTIFICATION_URI, {
//             message: importing
//               ? `Deployment imported successfully: ${deployment.claim.metadata.name}`
//               : `New deployment created: ${deployment.claim.metadata.name}`,
//             deploymentId: deployment._id,
//             source: packageJson.name,
//             level: 'info',
//             reason: 'new'
//           })
//         } catch {
//           logger.debug('Cannot connect to socket-service')
//         }
//         res.status(200).json(deployment)
//       })
//       .catch(async (err) => {
//         await Deployment.findByIdAndDelete(deploymentId)
//         next(err)
//       })
//   } catch (error) {
//     if (deploymentId && !importing) {
//       await Deployment.findByIdAndDelete(deploymentId)
//     }
//     next(error)
//   }
// })

module.exports = router
