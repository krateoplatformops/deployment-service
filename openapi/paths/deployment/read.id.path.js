module.exports = {
  tags: ['deployment'],
  description: 'Return single deployment',
  operationId: 'getSingleDeployment',
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
    404: {
      description: 'Deployment with id :id is not found',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Response'
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
