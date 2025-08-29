import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment variables validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  HOST: Joi.string().default('localhost'),
  
  // Database
  MONGODB_URI: Joi.string().required(),
  MONGODB_TEST_URI: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  // Redis
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRE: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRE: Joi.string().default('30d'),
  
  // AI Configuration
  GEMINI_API_KEY: Joi.string().required(),
  GEMINI_MODEL: Joi.string().default('gemini-pro'),
  OPENAI_API_KEY: Joi.string().optional(),
  
  // IPFS
  PINATA_API_KEY: Joi.string().required(),
  PINATA_API_SECRET: Joi.string().required(),
  PINATA_JWT: Joi.string().optional(),
  NFT_STORAGE_API_KEY: Joi.string().optional(),
  
  // Blockchain
  ZETACHAIN_RPC_URL: Joi.string().uri().required(),
  ZETACHAIN_CHAIN_ID: Joi.number().default(7001),
  CHAINWEAVE_CONTRACT_ADDRESS: Joi.string().required(),
  BACKEND_PRIVATE_KEY: Joi.string().required(),
  OWNER_PRIVATE_KEY: Joi.string().optional(),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/chainweave.log'),
  
  // Health check
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
  
  // AI settings
  AI_GENERATION_TIMEOUT: Joi.number().default(30000),
  MAX_PROMPT_LENGTH: Joi.number().default(500),
  MIN_PROMPT_LENGTH: Joi.number().default(10),
  
  // File upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: Joi.string().default('image/jpeg,image/png,image/webp'),
  
  // Webhooks
  WEBHOOK_SECRET: Joi.string().optional(),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,
  
  database: {
    uri: envVars.MONGODB_URI,
    testUri: envVars.MONGODB_TEST_URI,
  },
  
  redis: {
    url: envVars.REDIS_URL,
    password: envVars.REDIS_PASSWORD,
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    expire: envVars.JWT_EXPIRE,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpire: envVars.JWT_REFRESH_EXPIRE,
  },
  
  ai: {
    gemini: {
      apiKey: envVars.GEMINI_API_KEY,
      model: envVars.GEMINI_MODEL,
    },
    openai: {
      apiKey: envVars.OPENAI_API_KEY,
    },
    timeout: envVars.AI_GENERATION_TIMEOUT,
    maxPromptLength: envVars.MAX_PROMPT_LENGTH,
    minPromptLength: envVars.MIN_PROMPT_LENGTH,
  },
  
  ipfs: {
    pinata: {
      apiKey: envVars.PINATA_API_KEY,
      apiSecret: envVars.PINATA_API_SECRET,
      jwt: envVars.PINATA_JWT,
    },
    nftStorage: {
      apiKey: envVars.NFT_STORAGE_API_KEY,
    },
  },
  
  blockchain: {
    zetachain: {
      rpcUrl: envVars.ZETACHAIN_RPC_URL,
      chainId: envVars.ZETACHAIN_CHAIN_ID,
      contractAddress: envVars.CHAINWEAVE_CONTRACT_ADDRESS,
    },
    backendPrivateKey: envVars.BACKEND_PRIVATE_KEY,
    ownerPrivateKey: envVars.OWNER_PRIVATE_KEY,
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  
  cors: {
    origin: envVars.CORS_ORIGIN.split(','),
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
  },
  
  healthCheck: {
    interval: envVars.HEALTH_CHECK_INTERVAL,
  },
  
  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    allowedTypes: envVars.ALLOWED_FILE_TYPES.split(','),
  },
  
  webhook: {
    secret: envVars.WEBHOOK_SECRET,
  },
} as const;

export type Config = typeof config;