module.exports = {
  tags: ['deployment'],
  description: 'Return all deployments',
  operationId: 'getDeployments',
  parameters: [],
  responses: {
    200: {
      description: 'All deployments',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Deployment'
          }
        }
      }
    },
    500: {
      description: 'Server Error',
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
