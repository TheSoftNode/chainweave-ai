import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from '@/middleware/cors';
import { generalLimiter } from '@/middleware/rateLimiter';
import { sanitizeInput, limitRequestSize } from '@/middleware/validation';
import { apiRoutes } from '@/routes';
import { connectToDatabase } from '@/config/database';
import { env } from '@/config/env';
import { logger, performanceLogger } from '@/utils/logger';
import { ApiResponse } from '@/types';

const app = express();

// Trust proxy if behind load balancer
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(corsMiddleware);

// Compression
app.use(compression());

// Request size limiting
app.use(limitRequestSize(2 * 1024 * 1024)); // 2MB limit

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Log slow requests
    if (duration > 1000) {
      performanceLogger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
      });
    }
  });
  
  next();
});

// API routes
app.use('/api/v1', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ChainWeave AI Backend is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: env.NODE_ENV,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ChainWeave AI Backend API',
    version: '1.0.0',
    documentation: '/api/v1',
    health: '/health',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  } as ApiResponse);
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  const errorMessage = env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(error.status || 500).json({
    success: false,
    error: errorMessage,
  } as ApiResponse);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during graceful shutdown', { error: err.message });
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to database
    await connectToDatabase();
    logger.info('Database connected successfully');

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`ChainWeave AI Backend running on port ${env.PORT}`, {
        environment: env.NODE_ENV,
        port: env.PORT,
      });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

// Start the server
const server = startServer();

export { app, server };