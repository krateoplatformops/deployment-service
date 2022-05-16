module.exports = {
  tags: ['deployment'],
  description: 'Delete single deployment',
  operationId: 'deleteDeploymentId',
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'ID of deployment to return',
      required: true,
      schema: {
        type: 'string'
      }
    }
  ],
  responses: {
    200: {
      description: 'Deployment deleted',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Response'
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
