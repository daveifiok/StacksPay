import { Router } from 'express';
import { AuthController } from '@/controllers/auth/AuthController';
import { sessionMiddleware } from '@/middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Merchant authentication endpoints
 *   - name: Wallet Authentication  
 *     description: Stacks wallet connection and verification
 *   - name: API Keys
 *     description: API key management for developers
 *   - name: Profile
 *     description: Merchant profile management
 *   - name: Settings
 *     description: Merchant preferences and configuration
 */

// Public authentication routes (no auth required)

/**
 * @swagger
 * /api/auth/test:
 *   get:
 *     summary: Test endpoint to verify API is working
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: API is working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authentication API is working"
 *                 timestamp:
 *                   type: string
 *                   example: "2025-09-03T00:00:00.000Z"
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/register/email',
      'POST /api/auth/register/wallet', 
      'POST /api/auth/login/email',
      'POST /api/auth/login/wallet',
      'POST /api/auth/verify-email',
      'POST /api/auth/resend-verification',
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'POST /api/auth/refresh'
    ]
  });
});

/**
 * @swagger
 * /api/auth/register/email:
 *   post:
 *     summary: Register merchant with email/password
 *     tags: [Authentication]
 */
router.post('/register/email', authController.registerWithEmail.bind(authController));

/**
 * @swagger
 * /api/auth/register/wallet:
 *   post:
 *     summary: Register merchant with wallet connection
 *     tags: [Authentication]
 */
router.post('/register/wallet', authController.registerWithWallet.bind(authController));

/**
 * @swagger
 * /api/auth/login/email:
 *   post:
 *     summary: Login merchant with email/password
 *     tags: [Authentication]
 */
router.post('/login/email', authController.loginWithEmail.bind(authController));

/**
 * @swagger
 * /api/auth/login/wallet:
 *   post:
 *     summary: Login merchant with wallet signature
 *     tags: [Authentication]
 */
router.post('/login/wallet', authController.loginWithWallet.bind(authController));

// Wallet challenge endpoints (public)
/**
 * @swagger
 * /api/auth/wallet/challenge:
 *   get:
 *     summary: Generate wallet challenge message
 *     tags: [Wallet Authentication]
 */
router.get('/wallet/challenge', authController.generateWalletChallenge.bind(authController));

/**
 * @swagger
 * /api/auth/wallet/verify:
 *   post:
 *     summary: Verify wallet signature
 *     tags: [Wallet Authentication]
 */
router.post('/wallet/verify', authController.verifyWalletSignature.bind(authController));

/**
 * @swagger
 * /api/auth/connect-wallet:
 *   post:
 *     summary: Connect wallet to existing user account
 *     tags: [Wallet Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/connect-wallet', sessionMiddleware, authController.connectWallet.bind(authController));

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address with token
 *     tags: [Authentication]
 */
router.post('/verify-email', authController.verifyEmail.bind(authController));

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 */
router.post('/resend-verification', authController.resendVerificationEmail.bind(authController));

// Protected routes (require session authentication)
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout merchant
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', sessionMiddleware, authController.logout.bind(authController));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current merchant info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', sessionMiddleware, authController.getCurrentMerchant.bind(authController));

// Profile management routes (require session authentication)
/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get merchant profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update merchant profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', sessionMiddleware, authController.getProfile.bind(authController));
router.put('/profile', sessionMiddleware, authController.updateProfile.bind(authController));

// Settings management routes (require session authentication)
/**
 * @swagger
 * /api/auth/settings:
 *   get:
 *     summary: Get merchant settings and preferences
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update merchant settings and preferences
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/settings', sessionMiddleware, authController.getSettings.bind(authController));
router.put('/settings', sessionMiddleware, authController.updateSettings.bind(authController));

// API key management routes (require session authentication)
/**
 * @swagger
 * /api/auth/api-keys:
 *   get:
 *     summary: List merchant API keys
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.get('/api-keys', sessionMiddleware, authController.getApiKeys.bind(authController));
router.post('/api-keys', sessionMiddleware, authController.createApiKey.bind(authController));

/**
 * @swagger
 * /api/auth/api-keys/{keyId}:
 *   delete:
 *     summary: Revoke API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/api-keys/:keyId', sessionMiddleware, authController.revokeApiKey.bind(authController));

// Two-Factor Authentication routes (require session authentication)
/**
 * @swagger
 * /api/auth/2fa/enable:
 *   post:
 *     summary: Enable two-factor authentication
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/enable', sessionMiddleware, authController.enable2FA.bind(authController));

/**
 * @swagger
 * /api/auth/2fa/confirm:
 *   post:
 *     summary: Confirm two-factor authentication setup
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/confirm', sessionMiddleware, authController.confirm2FA.bind(authController));

/**
 * @swagger
 * /api/auth/2fa/disable:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/disable', sessionMiddleware, authController.disable2FA.bind(authController));

// Password Management routes (require session authentication)
/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Update password
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.put('/password', sessionMiddleware, authController.updatePassword.bind(authController));

/**
 * @swagger
 * /api/auth/generated-password:
 *   get:
 *     summary: Get generated password for wallet users
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/generated-password', sessionMiddleware, authController.getGeneratedPassword.bind(authController));

// Email Management routes (require session authentication)
/**
 * @swagger
 * /api/auth/update-email:
 *   patch:
 *     summary: Update email for GitHub/wallet users
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Email updated successfully and verification sent
 *       400:
 *         description: Invalid email or email already exists
 *       401:
 *         description: Unauthorized
 */
router.patch('/update-email', sessionMiddleware, authController.updateEmail.bind(authController));

// Account Linking routes (require session authentication)
/**
 * @swagger
 * /api/auth/accounts/suggest-links:
 *   get:
 *     summary: Get suggested account links for current user
 *     tags: [Account Linking]
 *     security:
 *       - bearerAuth: []
 */
router.get('/accounts/suggest-links', sessionMiddleware, authController.getSuggestedLinks.bind(authController));

/**
 * @swagger
 * /api/auth/accounts/initiate-link:
 *   post:
 *     summary: Initiate account linking process
 *     tags: [Account Linking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/accounts/initiate-link', sessionMiddleware, authController.initiateLinking.bind(authController));

/**
 * @swagger
 * /api/auth/accounts/confirm-link:
 *   post:
 *     summary: Confirm account linking with token
 *     tags: [Account Linking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/accounts/confirm-link', sessionMiddleware, authController.confirmLinking.bind(authController));

/**
 * @swagger
 * /api/auth/accounts/linked:
 *   get:
 *     summary: Get all linked accounts for current user
 *     tags: [Account Linking]
 *     security:
 *       - bearerAuth: []
 */
router.get('/accounts/linked', sessionMiddleware, authController.getLinkedAccounts.bind(authController));

/**
 * @swagger
 * /api/auth/accounts/unlink:
 *   post:
 *     summary: Unlink an account
 *     tags: [Account Linking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/accounts/unlink', sessionMiddleware, authController.unlinkAccount.bind(authController));

export default router;