/**
 * Error Monitoring Routes
 * Provides endpoints for viewing error statistics and health status
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { errorService } from '@/services/error/error-service';
import { createLogger } from '@/utils/logger';

const router = Router();
const logger = createLogger('ErrorRoutes');

/**
 * @swagger
 * tags:
 *   - name: Monitoring
 *     description: System monitoring and error tracking endpoints
 */

/**
 * @swagger
 * /api/monitoring/test:
 *   get:
 *     summary: Test endpoint for monitoring API
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Monitoring API is working
 */
router.get('/test', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Monitoring API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/monitoring/health',
      'GET /api/monitoring/errors/stats',
      'GET /api/monitoring/errors/recent',
      'GET /api/monitoring/errors/summary'
    ]
  });
}));

/**
 * GET /health - System health check
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = errorService.getHealthCheck();
  
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 206 : 503;

  res.status(statusCode).json({
    success: true,
    data: {
      ...healthCheck,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /errors/stats - Error statistics
 */
router.get('/errors/stats', asyncHandler(async (req: Request, res: Response) => {
  const timeframe = req.query.timeframe as 'hour' | 'day' | 'week' || 'hour';
  const stats = errorService.getErrorStats(timeframe);

  res.json({
    success: true,
    data: {
      timeframe,
      ...stats,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /errors/recent - Recent errors
 */
router.get('/errors/recent', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const errors = errorService.getRecentErrors(limit);

  res.json({
    success: true,
    data: {
      errors,
      total: errors.length,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /errors/summary - Error summary dashboard
 */
router.get('/errors/summary', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = errorService.getHealthCheck();
  const hourStats = errorService.getErrorStats('hour');
  const dayStats = errorService.getErrorStats('day');
  const recentErrors = errorService.getRecentErrors(10);

  res.json({
    success: true,
    data: {
      health: healthCheck,
      statistics: {
        last_hour: hourStats,
        last_day: dayStats
      },
      recent_errors: recentErrors,
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;
