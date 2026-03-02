import mongoose from 'mongoose';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Database');

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

class DatabaseManager {
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 5;
  private readonly retryDelay: number = 5000;

  private getConfig(): DatabaseConfig {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    return {
      uri,
      options: {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
      }
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Already connected to MongoDB');
      return;
    }

    const config = this.getConfig();

    while (this.connectionAttempts < this.maxRetries) {
      try {
        this.connectionAttempts++;
        
        logger.info(`Connecting to MongoDB (attempt ${this.connectionAttempts}/${this.maxRetries})`);
        
        await mongoose.connect(config.uri, config.options);
        
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        logger.info('Successfully connected to MongoDB');
        
        this.setupEventHandlers();
        return;
        
      } catch (error) {
        logger.error(`MongoDB connection attempt ${this.connectionAttempts} failed:`, error);
        
        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      this.isConnected = true;
    });
  }

  getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async startTransaction<T>(
    operation: (session: mongoose.ClientSession) => Promise<T>
  ): Promise<T> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        return await operation(session);
      }, {
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
        readPreference: 'primary'
      });
    } finally {
      await session.endSession();
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    readyState: number;
    host: string;
    port: number;
    database: string;
    connectionCount: number;
  }> {
    try {
      const connection = mongoose.connection;
      
      return {
        status: this.isHealthy() ? 'healthy' : 'unhealthy',
        readyState: connection.readyState,
        host: connection.host || 'unknown',
        port: connection.port || 0,
        database: connection.name || 'unknown',
        connectionCount: mongoose.connections.length
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        readyState: 0,
        host: 'unknown',
        port: 0,
        database: 'unknown',
        connectionCount: 0
      };
    }
  }
}

export const databaseManager = new DatabaseManager();
export const connectToDatabase = () => databaseManager.connect();
export const disconnectFromDatabase = () => databaseManager.disconnect();
export const startTransaction = <T>(operation: (session: mongoose.ClientSession) => Promise<T>) => 
  databaseManager.startTransaction(operation);
export const getDatabaseHealth = () => databaseManager.healthCheck();