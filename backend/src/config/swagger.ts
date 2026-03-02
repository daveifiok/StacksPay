import swaggerJSDoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import config from '@/config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'sBTC Payment Gateway API',
      version: '1.0.0',
      description: `
# sBTC Payment Gateway - The Stripe Experience for Bitcoin Payments

## Overview
The world's first "Stripe for Bitcoin" providing identical developer experience as Stripe but for Bitcoin payments through sBTC.

## Key Features
- **3-line integration** (vs Stripe's 7 lines)
- **0.5% fees** (vs Stripe's 2.9%)  
- **No chargebacks** (Bitcoin finality)
- **Global instant settlement**
- **Dual currency support**: Bitcoin + STX → sBTC

## Authentication
This API uses three authentication methods:

### 1. API Key Authentication (for developers)
Use Bearer token with your API key:
\`\`\`
Authorization: Bearer sk_test_your_api_key_here
\`\`\`

### 2. JWT Session Authentication (for dashboard)
Use Bearer token with your session JWT:
\`\`\`
Authorization: Bearer your_jwt_token_here
\`\`\`

### 3. Wallet Authentication (for customers)
Message signing with Stacks wallet for payment authorization.

## Environments
- **Test**: Use \`sk_test_\` keys for development and testing
- **Live**: Use \`sk_live_\` keys for production payments

## Rate Limits
- **Test environment**: 100 requests/hour per API key
- **Live environment**: 1000 requests/hour per API key
- **Unauthenticated**: 50 requests/hour per IP

## Support
- Documentation: https://docs.stackspay.com
- Support: support@stackspay.com
- Status: https://status.stackspay.com
      `,
      contact: {
        name: 'StacksPay Support',
        email: 'support@stackspay.com',
        url: 'https://stackspay.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.stackspay.com',
        description: 'Production server'
      },
      {
        url: 'https://api-staging.stackspay.com',
        description: 'Staging server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT or API Key',
          description: 'JWT token for session auth or API key (sk_test_/sk_live_) for API auth'
        },
        apiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'API Key authentication using sk_test_ or sk_live_ keys'
        }
      },
      parameters: {
        MerchantId: {
          name: 'merchantId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Merchant ID'
        },
        PaymentId: {
          name: 'paymentId', 
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Payment ID'
        }
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Authentication required' }
                }
              }
            }
          }
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Insufficient permissions' }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Missing required fields' }
                }
              }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Internal server error' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Merchant account registration and login'
      },
      {
        name: 'Wallet Authentication',
        description: 'Stacks wallet connection and signature verification'
      },
      {
        name: 'API Keys',
        description: 'API key management for developer integration'
      },
      {
        name: 'Payments',
        description: 'sBTC payment processing endpoints'
      },
      {
        name: 'Merchants',
        description: 'Merchant account management'
      },
      {
        name: 'Analytics',
        description: 'Payment analytics and reporting'
      },
      {
        name: 'Webhooks',
        description: 'Webhook configuration and management'
      }
    ]
  },
  apis: [
    './src/controllers/*.ts',
    './src/routes/*.ts',
    './src/models/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI setup
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #ea580c; }
      .swagger-ui .scheme-container { background: #fff; border: 1px solid #ea580c; }
    `,
    customSiteTitle: 'sBTC Payment Gateway API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    }
  }));

  // Swagger JSON endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📖 Swagger API Documentation available at: http://localhost:${config.port}/api/docs`);
  console.log(`📄 Swagger JSON spec available at: http://localhost:${config.port}/api/docs.json`);
};