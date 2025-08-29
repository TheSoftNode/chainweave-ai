#!/usr/bin/env node

/**
 * ChainWeave AI Backend
 * Main entry point for the application
 */

import { config } from 'dotenv';

// Load environment variables first
config();

import { logger } from '@/utils/logger';

// Uncaught exception handler
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    reason: reason?.message || reason,
    promise: promise.toString(),
  });
  process.exit(1);
});

// Import and start the server
import './server';

logger.info('ChainWeave AI Backend starting...', {
  node_version: process.version,
  environment: process.env.NODE_ENV,
  pid: process.pid,
});