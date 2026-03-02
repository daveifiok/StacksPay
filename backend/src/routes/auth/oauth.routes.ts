import express from 'express';
import passport from 'passport';
import { sessionService } from '@/services/auth/session-service';
import { authService } from '@/services/auth/auth-service';
import { createLogger } from '@/utils/logger';

const logger = createLogger('OAuthRoutes');
const router = express.Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to dashboard on success, login on failure
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed` 
  }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      // Create session
      const session = await sessionService.createSession(
        (user._id || user.id).toString(),
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        false // rememberMe
      );

      // Set session token
      res.cookie('session_token', session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info('Google OAuth login successful', { 
        userId: user._id || user.id, 
        email: user.email 
      });

      // Redirect to auth callback page with tokens in URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = frontendUrl.endsWith('/') ? 
        `${frontendUrl}auth/callback?sessionId=${session.sessionId}&provider=google` : 
        `${frontendUrl}/auth/callback?sessionId=${session.sessionId}&provider=google`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = frontendUrl.endsWith('/') ? 
        `${frontendUrl}login?error=oauth_error` : 
        `${frontendUrl}/login?error=oauth_error`;
      res.redirect(errorUrl);
    }
  }
);

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth
 */
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'] 
  })
);

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: Handle GitHub OAuth callback
 *     tags: [Authentication]  
 *     responses:
 *       302:
 *         description: Redirect to dashboard on success, login on failure
 */
router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed` 
  }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      // Create session
      const session = await sessionService.createSession(
        (user._id || user.id).toString(),
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        false // rememberMe
      );

      // Set session token
      res.cookie('session_token', session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info('GitHub OAuth login successful', { 
        userId: user._id || user.id, 
        email: user.email 
      });

      // Redirect to auth callback page with tokens in URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = frontendUrl.endsWith('/') ? 
        `${frontendUrl}auth/callback?sessionId=${session.sessionId}&provider=github` : 
        `${frontendUrl}/auth/callback?sessionId=${session.sessionId}&provider=github`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('GitHub OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = frontendUrl.endsWith('/') ? 
        `${frontendUrl}login?error=oauth_error` : 
        `${frontendUrl}/login?error=oauth_error`;
      res.redirect(errorUrl);
    }
  }
);

/**
 * @swagger
 * /api/auth/oauth/session-exchange:
 *   post:
 *     summary: Exchange session ID for JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *             required:
 *               - sessionId
 *     responses:
 *       200:
 *         description: JWT tokens returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 merchant:
 *                   type: object
 */
router.post('/session-exchange', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Exchange session for JWT tokens
    const result = await authService.exchangeSessionForTokens(sessionId);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error || 'Failed to exchange session for tokens'
      });
    }

    logger.info('Session exchanged for JWT tokens', { 
      merchantId: result.merchant?.id,
      sessionId: sessionId
    });

    res.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      merchant: result.merchant
    });
  } catch (error) {
    logger.error('Session exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;