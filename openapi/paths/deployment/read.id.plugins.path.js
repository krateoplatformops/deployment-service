module.exports = {
  tags: ['deployment'],
  description: 'Return deployment plugin',
  operationId: 'getDeploymentPlugin',
  parameters: [],
  responses: {
    200: {
      description: 'Deployment plugin',
      content: {
        'application/json': {
          schema: {
            type: 'object'
          }
        }
      }
    },
    500: {
      description: 'Server Error / Unsupported plugin type',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Response'
          }
        }
      }
    }
  }
}
