import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  port: number;
  nodeEnv: string;
  apiVersion: string;
  
  database: {
    uri: string;
    name: string;
  };

  stacks: {
    network: 'mainnet' | 'testnet' | 'devnet';
    apiUrl: string;
  };

  bitcoin: {
    network: 'mainnet' | 'testnet';
    rpcUrl?: string;
  };

  sbtc: {
    apiUrl: string;
    contractAddress: string;
    signerApiUrl: string;
  };

  circle: {
    apiKey: string;
    environment: 'sandbox' | 'production';
    baseUrl: string;
  };

  coinbase: {
    apiKey: string;
    webhookSecret: string;
  };

  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };

  webhook: {
    secret: string;
    timeout: number;
    retryAttempts: number;
  };

  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };

  security: {
    corsOrigins: string[];
    trustProxy: boolean;
    encryptionKey: string;
  };

  logging: {
    level: string;
    format: string;
  };
}

function getConfig(): AppConfig {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'WEBHOOK_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }

  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',

    database: {
      uri: process.env.MONGODB_URI!,
      name: process.env.DATABASE_NAME || 'sbtc_payment_gateway',
    },

    stacks: {
      network: (process.env.STACKS_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'testnet',
      apiUrl: process.env.STACKS_API_URL || 'https://api.testnet.hiro.so',
    },

    bitcoin: {
      network: (process.env.BITCOIN_NETWORK as 'mainnet' | 'testnet') || 'testnet',
      rpcUrl: process.env.BITCOIN_RPC_URL,
    },

    sbtc: {
      apiUrl: process.env.SBTC_API_URL || 'https://devenv.sbtc.tech',
      contractAddress: process.env.SBTC_CONTRACT_ADDRESS || 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
      signerApiUrl: process.env.SBTC_SIGNER_API_URL || 'https://signer.sbtc.tech',
    },

    circle: {
      apiKey: process.env.CIRCLE_API_KEY || '',
      environment: (process.env.CIRCLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      baseUrl: process.env.CIRCLE_BASE_URL || 'https://api-sandbox.circle.com',
    },

    coinbase: {
      apiKey: process.env.COINBASE_API_KEY || '',
      webhookSecret: process.env.COINBASE_WEBHOOK_SECRET || '',
    },

    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    webhook: {
      secret: process.env.WEBHOOK_SECRET!,
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000', 10),
      retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10),
    },

    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
    },

    security: {
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      trustProxy: process.env.TRUST_PROXY === 'true',
      encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET!,
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'combined',
    },
  };
}

export const config = getConfig();
export default config;