const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const k8s = require('@kubernetes/client-node')

const Deployment = mongoose.model('Deployment')

router.delete('/:id', async (req, res, next) => {
  try {
    Deployment.findById(req.params.id).exec(async (err, deployment) => {
      if (err) {
        next(err)
      } else if (!deployment) {
        res.status(404).json({
          message: `Deployment with id ${req.params.id} not found and cannot be deleted`
        })
      } else {
        // delete from k8s
        const kc = new k8s.KubeConfig()
        kc.loadFromDefault()
        const client = k8s.KubernetesObjectApi.makeApiClient(kc)

        const validSpecs = [deployment.claim, deployment.package]
        for (const spec of validSpecs) {
          await client.delete(spec)
        }
        await Deployment.findByIdAndDelete(req.params.id).exec()
        // response
        res
          .status(200)
          .json({ message: `Deployment with id ${req.params.id} deleted` })
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
