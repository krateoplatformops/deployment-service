module.exports = {
  tags: ['deployment'],
  description: 'Add and return single deployment',
  operationId: 'addDeployment',
  requestBody: {
    description: 'Optional description in *Markdown*',
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            templateId: {
              type: 'string',
              description: 'Template ID'
            },
            metadata: {
              type: 'object',
              description: 'Deployment metadata'
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
