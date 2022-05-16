module.exports = {
  tags: ['deployment'],
  description: 'Add and return single deployment',
  operationId: 'addDeploymentImport',
  requestBody: {
    description: 'Optional description in *Markdown*',
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            endpointName: {
              type: 'string',
              description: 'Endpoint name'
            },
            url: {
              type: 'string',
              description: 'Url file to import'
            }
          }
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Deployment added',
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
