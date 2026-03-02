import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import { connectToDatabase } from '@/config/database';
import { setupSwagger } from '@/config/swagger';
import authRoutes from '@/routes/auth/auth.routes';
import oauthRoutes from '@/routes/auth/oauth.routes';
import authPaymentRoutes from '@/routes/auth/payments.routes';
import onboardingRoutes from '@/routes/onboarding/onboarding.routes';
import webhookRoutes from '@/routes/webhook/webhook.routes';
import webhookEventsRoutes from '@/routes/webhook/webhook-events.routes';
import apiKeyRoutes from '@/routes/apikey/api-key.routes';
import notificationRoutes from '@/routes/notification/notification.routes';
import errorRoutes from '@/routes/error/error.routes';
import testRoutes from '@/routes/test/test.routes';
import walletRoutes from '@/routes/wallet/wallet';
import stxPaymentRoutes from '@/routes/payment/stx-payment.routes';
import config from '@/config';
import { createLogger } from '@/utils/logger';
import { webhookService } from '@/services/webhook/webhook-service';
import { stacksBlockchainMonitor } from '@/services/blockchain/stacks-blockchain-monitor';
import { 
  errorHandler, 
  notFoundHandler, 
  requestIdMiddleware,
  asyncHandler 
} from '@/middleware/error.middleware';

// Increase max event listeners to prevent warnings
process.setMaxListeners(20);

const logger = createLogger('Server');

class sBTCPaymentGatewayServer {
  private app: express.Application;
  private server?: any;
  private gracefulShutdownConfigured = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Request ID tracking (must be first)
    this.app.use(requestIdMiddleware);

    // Trust proxy for accurate IP addresses
    if (config.security.trustProxy) {
      this.app.set('trust proxy', 1);
    }

    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.security.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    }));

    // Session middleware for OAuth
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Initialize Passport
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // Initialize OAuth service
    import('@/services/auth/oauth-service');

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification
        (req as any).rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      skipSuccessfulRequests: config.rateLimit.skipSuccessfulRequests,
      message: {
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString()
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    logger.info('✅ Middleware setup completed');
  }

  private setupRoutes(): void {
    // Health check endpoint (before rate limiting)
    this.app.get('/health', asyncHandler(async (req: express.Request, res: express.Response) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv,
        uptime: process.uptime(),
        requestId: req.headers['x-request-id']
      });
    }));

    logger.info('✅ Routes setup completed');
  }

  private setupApiRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/auth', oauthRoutes);
    this.app.use('/api/auth/payments', authPaymentRoutes); // Session-based payment management for dashboard
    this.app.use('/api/onboarding', onboardingRoutes); // Onboarding progress tracking
    this.app.use('/api/webhooks', webhookRoutes); // JWT auth for merchant dashboard
    this.app.use('/api/webhook-events', webhookEventsRoutes); // JWT auth for merchant dashboard
    this.app.use('/api/api-keys', apiKeyRoutes); // JWT auth for API key management
    this.app.use('/api/notifications', notificationRoutes);
    this.app.use('/api/monitoring', errorRoutes);
    this.app.use('/api/test', testRoutes);
    this.app.use('/api/wallet', walletRoutes);
    this.app.use('/api/payments', stxPaymentRoutes); // STX payment routes
    this.app.use('/api', stxPaymentRoutes); // STX webhook and public routes

    // 404 handler for unmatched routes (must be before error handler)
    this.app.use('*', notFoundHandler);

    logger.info('✅ API routes setup completed');
  }

  private setupErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(errorHandler);

    logger.info('✅ Error handling setup completed');
  }

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting sBTC Payment Gateway server...');
      
      // Connect to database first
      logger.info('📊 Connecting to database...');
      await connectToDatabase();
      logger.info('✅ Database connected successfully');

      // Setup Swagger documentation (before API routes)
      logger.info('📖 Setting up API documentation...');
      setupSwagger(this.app);
      logger.info('✅ API documentation configured');

      // Setup API routes (after Swagger)
      this.setupApiRoutes();

      // Start webhook background processing
      webhookService.startBackgroundProcessing();

      // Start blockchain monitoring for pending STX payments
      logger.info('🔍 Starting blockchain monitoring service...');
      stacksBlockchainMonitor.startMonitoring();
      logger.info('✅ Blockchain monitoring started');

      // Start server
      logger.info(`🌐 Starting server on port ${config.port}...`);
      this.server = this.app.listen(config.port, () => {
        logger.info(`🚀 sBTC Payment Gateway API Server started successfully`);
        logger.info(`📍 Server running on port ${config.port}`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
        logger.info(`📖 API Documentation: http://localhost:${config.port}/api/docs`);
        logger.info(`🔗 Health Check: http://localhost:${config.port}/health`);
        logger.info(`💼 Ready to process Bitcoin payments through sBTC`);
        logger.info(`✨ All systems operational!`);
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      if (error instanceof Error) {
        logger.error('Error details:', {
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
      }
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          logger.error('💥 Database connection failed. Please check your MONGODB_URI in .env file');
        } else if (error.message.includes('EADDRINUSE')) {
          logger.error(`💥 Port ${config.port} is already in use. Please stop other services or change the PORT in .env`);
        } else if (error.message.includes('MODULE_NOT_FOUND')) {
          logger.error('💥 Missing dependencies. Please run: npm install');
        }
      }
      
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    // Prevent duplicate listener setup
    if (this.gracefulShutdownConfigured) {
      return;
    }
    this.gracefulShutdownConfigured = true;

    const shutdown = async (signal: string) => {
      logger.info(`📤 Received ${signal}, shutting down gracefully...`);
      
      if (this.server) {
        this.server.close(async () => {
          logger.info('✅ Express server closed');
          
          try {
            const { disconnectFromDatabase } = await import('@/config/database');
            await disconnectFromDatabase();
            logger.info('✅ Database disconnected');
            logger.info('👋 Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
          logger.error('⚠️ Forcing shutdown after timeout');
          process.exit(1);
        }, 30000);
      }
    };

    // Remove existing listeners to prevent duplicates
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    // Add new listeners
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
    
    process.once('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      // Report to error service
      try {
        const { errorService } = require('@/services/error/error-service');
        errorService.reportError(error, {
          service: 'server',
          operation: 'uncaught_exception'
        });
      } catch (reportError) {
        logger.error('Failed to report uncaught exception:', reportError);
      }
      process.exit(1);
    });

    process.once('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      // Report to error service
      try {
        const { errorService } = require('@/services/error/error-service');
        const error = reason instanceof Error ? reason : new Error(String(reason));
        errorService.reportError(error, {
          service: 'server',
          operation: 'unhandled_rejection'
        });
      } catch (reportError) {
        logger.error('Failed to report unhandled rejection:', reportError);
      }
      process.exit(1);
    });

    logger.info('✅ Graceful shutdown handlers configured');
  }

  getApp(): express.Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new sBTCPaymentGatewayServer();
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default sBTCPaymentGatewayServer;
export { sBTCPaymentGatewayServer };