/**
 * Error Service for sBTC Payment Gateway
 * Centralized error reporting and monitoring
 */

import { createLogger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import config from '@/config';

const logger = createLogger('ErrorService');

interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'warning' | 'error' | 'critical';
  service: string;
  operation: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: {
    userId?: string;
    merchantId?: string;
    paymentId?: string;
    requestId?: string;
    metadata?: any;
  };
  environment: string;
}

class ErrorService {
  private errorReports: ErrorReport[] = [];
  private maxReports = 1000; // Keep last 1000 error reports in memory

  /**
   * Report an error to the service
   */
  reportError(
    error: Error | AppError,
    context: {
      service: string;
      operation: string;
      userId?: string;
      merchantId?: string;
      paymentId?: string;
      requestId?: string;
      metadata?: any;
    }
  ): string {
    const errorId = this.generateErrorId();
    const level = this.determineErrorLevel(error);

    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      level,
      service: context.service,
      operation: context.operation,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error instanceof AppError ? error.errorCode : undefined
      },
      context: {
        userId: context.userId,
        merchantId: context.merchantId,
        paymentId: context.paymentId,
        requestId: context.requestId,
        metadata: context.metadata
      },
      environment: config.nodeEnv
    };

    // Store report
    this.storeErrorReport(report);

    // Log based on severity
    this.logError(report, error);

    // Send to external monitoring services if configured
    this.sendToMonitoring(report);

    return errorId;
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeframe: 'hour' | 'day' | 'week' = 'hour'): {
    total: number;
    byLevel: Record<string, number>;
    byService: Record<string, number>;
    topErrors: Array<{ message: string; count: number }>;
  } {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const recentErrors = this.errorReports.filter(
      report => new Date(report.timestamp) >= cutoff
    );

    const stats = {
      total: recentErrors.length,
      byLevel: {} as Record<string, number>,
      byService: {} as Record<string, number>,
      topErrors: [] as Array<{ message: string; count: number }>
    };

    // Count by level
    recentErrors.forEach(report => {
      stats.byLevel[report.level] = (stats.byLevel[report.level] || 0) + 1;
      stats.byService[report.service] = (stats.byService[report.service] || 0) + 1;
    });

    // Count error messages
    const errorCounts = new Map<string, number>();
    recentErrors.forEach(report => {
      const count = errorCounts.get(report.error.message) || 0;
      errorCounts.set(report.error.message, count + 1);
    });

    // Get top 10 errors
    stats.topErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return stats;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorReport[] {
    return this.errorReports
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Check system health based on error patterns
   */
  getHealthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errors: {
      last_hour: number;
      critical_last_hour: number;
      consecutive_failures: number;
    };
    services: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  } {
    const hourStats = this.getErrorStats('hour');
    const criticalErrors = this.errorReports
      .filter(report => 
        report.level === 'critical' && 
        new Date(report.timestamp) >= this.getTimeframeCutoff('hour')
      ).length;

    // Check for consecutive failures in critical services
    const consecutiveFailures = this.getConsecutiveFailures();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (criticalErrors > 5 || consecutiveFailures > 3) {
      status = 'unhealthy';
    } else if (hourStats.total > 20 || criticalErrors > 0) {
      status = 'degraded';
    }

    // Check service-specific health
    const services: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};
    Object.entries(hourStats.byService).forEach(([service, errorCount]) => {
      if (errorCount > 10) {
        services[service] = 'unhealthy';
      } else if (errorCount > 5) {
        services[service] = 'degraded';
      } else {
        services[service] = 'healthy';
      }
    });

    return {
      status,
      errors: {
        last_hour: hourStats.total,
        critical_last_hour: criticalErrors,
        consecutive_failures: consecutiveFailures
      },
      services
    };
  }

  private storeErrorReport(report: ErrorReport): void {
    this.errorReports.push(report);
    
    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }
  }

  private logError(report: ErrorReport, originalError: Error): void {
    const logData = {
      errorId: report.id,
      service: report.service,
      operation: report.operation,
      level: report.level,
      context: report.context,
      error: report.error
    };

    switch (report.level) {
      case 'critical':
        logger.error('CRITICAL ERROR:', logData);
        break;
      case 'error':
        logger.error('ERROR:', logData);
        break;
      case 'warning':
        logger.warn('WARNING:', logData);
        break;
    }
  }

  private sendToMonitoring(report: ErrorReport): void {
    // Here you would integrate with external monitoring services
    // like Sentry, DataDog, New Relic, etc.
    
    // Example for development - just log
    if (config.nodeEnv === 'development') {
      logger.debug('Would send to monitoring service:', {
        errorId: report.id,
        level: report.level,
        service: report.service,
        message: report.error.message
      });
    }

    // TODO: Implement actual monitoring service integration
    // if (config.monitoring?.sentryDsn) {
    //   Sentry.captureException(error, { extra: report });
    // }
  }

  private determineErrorLevel(error: Error | AppError): 'warning' | 'error' | 'critical' {
    if (error instanceof AppError) {
      // Business logic errors are usually warnings or errors
      if (error.statusCode >= 500) {
        return 'error';
      } else if (error.statusCode >= 400) {
        return 'warning';
      }
    }

    // System errors
    if (error.name === 'DatabaseError' || error.name === 'MongoError') {
      return 'critical';
    }

    if (error.name === 'BlockchainError' || error.name === 'SbtcError') {
      return 'error';
    }

    if (error.name === 'ValidationError' || error.name === 'PaymentError') {
      return 'warning';
    }

    // Default for unknown errors
    return 'error';
  }

  private getTimeframeCutoff(timeframe: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 60 * 60 * 1000);
    }
  }

  private getConsecutiveFailures(): number {
    // Look for consecutive critical errors in the last 10 reports
    const recentReports = this.errorReports.slice(-10);
    let consecutive = 0;
    
    for (let i = recentReports.length - 1; i >= 0; i--) {
      if (recentReports[i].level === 'critical') {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}

// Export singleton instance
export const errorService = new ErrorService();
export default errorService;
