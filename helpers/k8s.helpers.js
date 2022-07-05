const { logger } = require('./logger.helpers')

const create = async (client, spec) => {
  spec.metadata = spec.metadata || {}
  spec.metadata.annotations = spec.metadata.annotations || {}
  delete spec.metadata.annotations[
    'kubectl.kubernetes.io/last-applied-configuration'
  ]
  spec.metadata.annotations[
    'kubectl.kubernetes.io/last-applied-configuration'
  ] = JSON.stringify(spec)
  await client
    .read(spec)
    .then(async () => {
      await client
        .patch(
          spec,
          {},
          {},
          {},
          {},
          {
            headers: {
              'content-type': 'application/merge-patch+json'
            }
          }
        )
        .then(async () => {
          logger.debug('patched')
        })
        .catch(async () => {
          logger.debug(`Error patching ${spec.kind} ${spec.metadata.name}`)
        })
    })
    .catch(async () => {
      await client
        .create(spec)
        .then(async () => {
          logger.debug(`Create ${spec.kind} ${spec.metadata.name}`)
        })
        .catch(async () => {
          logger.debug(`Error creating ${spec.kind} ${spec.metadata.name}`)
        })
    })
}

const wait = async (client, spec) => {
  const maxAttempts = 10
  let ready = false
  let attempt = 0

  while (!ready || attempt < maxAttempts) {
    await client
      .read(spec)
      .then(async (res) => {
        try {
          const installed = res.body.status.conditions.find(
            (x) => x.type === 'Installed'
          )
          const healthy = res.body.status.conditions.find(
            (x) => x.type === 'Healthy'
          )
          if (installed.status === 'True' && healthy.status === 'True') {
            ready = true
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      })
      .catch(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      })
    attempt++
  }
  if (!ready)
    throw new Error(`Timeout waiting for ${spec.kind} ${spec.metadata.name}`)
}

module.exports = {
  create,
  wait
}
