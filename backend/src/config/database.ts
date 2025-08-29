import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const uri = process.env['NODE_ENV'] === 'test' 
    ? process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/chainweave-ai-test'
    : process.env['MONGO_URI'] || 'mongodb://localhost:27017/chainweave-ai';

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
  };

  return { uri, options };
};

export const connectToDatabase = async (): Promise<void> => {
  try {
    const { uri, options } = getDatabaseConfig();
    
    await mongoose.connect(uri, options);
    
    logger.info('Successfully connected to MongoDB', {
      database: uri.split('/').pop(),
      environment: process.env['NODE_ENV'],
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});