import { Request, Response } from 'express';
import crypto from 'crypto';
import { sessionService } from '@/services/auth/session-service';
import { emailService } from '@/services/email/email-service';
import { merchantService } from '@/services/merchant/merchant-service';
import { createLogger } from '@/utils/logger';
import { getClientIpAddress} from '@/utils/request';
import { 
  RegisterRequest, 
  LoginRequest
} from '@/interfaces/auth/auth.interface';
import { WalletAuthRequest } from '@/interfaces/wallet/wallet.interface';
import { authService } from '@/services/auth/auth-service';
import { walletAuthService } from '@/services/wallet/wallet-auth-service';
import { accountLinkingService } from '@/services/auth/account-linking-service';

const logger = createLogger('AuthController');

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - businessType
 *         - acceptTerms
 *       properties:
 *         name:
 *           type: string
 *           description: Business name
 *         email:
 *           type: string
 *           format: email
 *           description: Business email address
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Secure password
 *         businessType:
 *           type: string
 *           enum: [ecommerce, saas, marketplace, nonprofit, consulting, other]
 *         acceptTerms:
 *           type: boolean
 *           description: Must be true to accept terms and conditions
 *         stacksAddress:
 *           type: string
 *           description: Optional Stacks wallet address
 *         website:
 *           type: string
 *           format: uri
 *           description: Optional business website
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         rememberMe:
 *           type: boolean
 *           default: false
 *     
 *     WalletAuthRequest:
 *       type: object
 *       required:
 *         - address
 *         - signature
 *         - message
 *         - publicKey
 *         - walletType
 *       properties:
 *         address:
 *           type: string
 *           description: Stacks wallet address
 *         signature:
 *           type: string
 *           description: Message signature from wallet
 *         message:
 *           type: string
 *           description: Challenge message that was signed
 *         publicKey:
 *           type: string
 *           description: Public key from wallet
 *         walletType:
 *           type: string
 *           enum: [stacks, bitcoin]
 *         paymentId:
 *           type: string
 *           description: Optional payment ID for payment authorization
 *         amount:
 *           type: number
 *           description: Optional payment amount in satoshis
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *           description: JWT access token
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 *         merchant:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             stacksAddress:
 *               type: string
 *             emailVerified:
 *               type: boolean
 *         apiKey:
 *           type: object
 *           properties:
 *             keyId:
 *               type: string
 *             apiKey:
 *               type: string
 *             keyPreview:
 *               type: string
 *             permissions:
 *               type: array
 *               items:
 *                 type: string
 *         error:
 *           type: string
 */

export class AuthController {
  /**
   * @swagger
   * /api/auth/register/email:
   *   post:
   *     tags: [Authentication]
   *     summary: Register merchant with email/password
   *     description: Traditional business registration with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *           example:
   *             name: "My Business"
   *             email: "business@example.com"
   *             password: "SecurePassword123!"
   *             businessType: "ecommerce"
   *             acceptTerms: true
   *             stacksAddress: "SP1ABC123DEF456GHI789JKL012MNO345PQR678STU"
   *             website: "https://mybusiness.com"
   *     responses:
   *       201:
   *         description: Registration successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Registration failed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   */
  async registerWithEmail(req: Request, res: Response): Promise<void> {
    try {
      const ipAddress = getClientIpAddress(req);
      const registerData: RegisterRequest = req.body;

      // Validate required fields
      if (!registerData.name || !registerData.email || !registerData.password || !registerData.businessType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, email, password, businessType'
        });
        return;
      }

      const userAgent = req.headers['user-agent'] || 'unknown';
      const result = await authService.register(registerData, ipAddress, userAgent);

      if (result.success) {
        logger.info('Merchant registered via email', {
          merchantId: result.merchant?.id,
          email: registerData.email,
          businessType: registerData.businessType,
          hasStacksAddress: !!registerData.stacksAddress
        });

        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('Email registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/register/wallet:
   *   post:
   *     tags: [Authentication]
   *     summary: Register merchant with wallet connection
   *     description: Instant merchant registration using Stacks wallet signature
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: '#/components/schemas/WalletAuthRequest'
   *               - type: object
   *                 required:
   *                   - businessName
   *                   - businessType
   *                 properties:
   *                   businessName:
   *                     type: string
   *                     description: Business name for the account
   *                   businessType:
   *                     type: string
   *                     enum: [ecommerce, saas, marketplace, nonprofit, consulting, other]
   *                   email:
   *                     type: string
   *                     format: email
   *                     description: Optional email for notifications
   *     responses:
   *       201:
   *         description: Wallet registration successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Registration failed
   */
  async registerWithWallet(req: Request, res: Response): Promise<void> {
    try {
      const ipAddress = getClientIpAddress(req);
      const walletData: WalletAuthRequest & { 
        businessName?: string; 
        businessType?: string; 
        email?: string; 
      } = req.body;

      // Validate only required wallet fields for signature verification
      if (!walletData.address || !walletData.signature || !walletData.message || !walletData.publicKey) {
        res.status(400).json({
          success: false,
          error: 'Missing required wallet fields: address, signature, message, publicKey'
        });
        return;
      }

      // Check if wallet is already registered
      const { Merchant } = await import('@/models/merchant/Merchant');
      const existingMerchant = await Merchant.findOne({ stacksAddress: walletData.address });
      
      if (existingMerchant) {
        res.status(400).json({
          success: false,
          error: 'This wallet address is already registered. Please login instead.'
        });
        return;
      }

      // First verify the wallet signature
      const walletVerification = await walletAuthService.verifyWalletConnection(walletData);
      
      if (!walletVerification.success || !walletVerification.verified) {
        res.status(400).json({
          success: false,
          error: walletVerification.error || 'Wallet signature verification failed'
        });
        return;
      }

      // Create merchant account with minimal data - user can complete profile later
      // Generate a valid password that meets all requirements for wallet users
      const generateValidPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const nums = '0123456789';
        const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const special = '!@#$%^&*';
        
        // Ensure we have at least one of each required character type
        let password = '';
        password += caps[Math.floor(Math.random() * caps.length)]; // uppercase
        password += chars[Math.floor(Math.random() * chars.length)]; // lowercase  
        password += nums[Math.floor(Math.random() * nums.length)]; // number
        password += special[Math.floor(Math.random() * special.length)]; // special char
        
        // Fill the rest with random characters to make it 16 chars total
        const allChars = chars + nums + caps + special;
        for (let i = 4; i < 16; i++) {
          password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password to avoid predictable patterns
        return password.split('').sort(() => Math.random() - 0.5).join('');
      };

      const generatedPassword = generateValidPassword();
      const merchantData: RegisterRequest = {
        name: walletData.businessName || `Wallet User ${walletData.address.slice(-6)}`, 
        email: walletData.email || '', // Allow empty email - user can add later
        password: generatedPassword, // Generate a password that meets requirements
        businessType: walletData.businessType || 'other', // Default business type
        stacksAddress: walletData.address,
        acceptTerms: true, // Auto-accept for wallet registrations
      };

      const userAgent = req.headers['user-agent'] || 'unknown';
      const result = await authService.registerWithWallet(merchantData, ipAddress, userAgent);

      if (result.success) {
        // Get the created merchant from the database to get full object
        const { Merchant } = await import('@/models/merchant/Merchant');
        const createdMerchant = await Merchant.findById(result.merchant?.id);
        
        if (!createdMerchant) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve created merchant'
          });
          return;
        }

        // Create session with proper tracking
        const sessionInfo = await sessionService.createSession(
          createdMerchant._id.toString(),
          ipAddress,
          userAgent,
          true, // rememberMe for wallet registrations
          undefined // deviceFingerprint
        );

        // Generate JWT tokens using the authService method
        const tokenResult = await (authService as any).createJWTTokens(
          createdMerchant, 
          sessionInfo.sessionId,
          true // rememberMe
        );

        logger.info('Merchant registered via wallet', {
          merchantId: createdMerchant._id.toString(),
          stacksAddress: walletData.address,
          businessType: merchantData.businessType,
          walletType: walletData.walletType || 'stacks',
          profileComplete: !!(walletData.businessName && walletData.businessType)
        });

        // Return success with wallet authentication context and session tokens
        res.status(201).json({
          success: true,
          token: tokenResult.token,
          refreshToken: tokenResult.refreshToken,
          merchant: {
            id: createdMerchant._id.toString(),
            name: createdMerchant.name,
            email: createdMerchant.email,
            stacksAddress: walletData.address,
            emailVerified: createdMerchant.emailVerified || false,
            verificationLevel: createdMerchant.verificationLevel || 'none',
            businessType: merchantData.businessType,
            profileComplete: !!(walletData.businessName && walletData.businessType), // Indicate if profile needs completion
          },
          walletConnected: true,
          authMethod: 'wallet',
          message: walletData.businessName ? 
            'Registration successful!' : 
            'Registration successful! Please complete your profile in settings.'
        });
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      logger.error('Wallet registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Wallet registration failed. Please try again.'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/login/email:
   *   post:
   *     tags: [Authentication]
   *     summary: Login merchant with email/password
   *     description: Traditional login for business dashboard access
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Invalid credentials
   */
  async loginWithEmail(req: Request, res: Response): Promise<void> {
    try {
      const ipAddress = getClientIpAddress(req);
      const userAgent = req.get('User-Agent') || '';
      const loginData: LoginRequest = req.body;

      // Validate required fields
      if (!loginData.email || !loginData.password) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password'
        });
        return;
      }

      const result = await authService.login(loginData, ipAddress, userAgent);

      if (result.success) {
        logger.info('Merchant logged in via email', {
          merchantId: result.merchant?.id,
          email: loginData.email,
          rememberMe: loginData.rememberMe
        });

        res.json({
          ...result,
          authMethod: 'email'
        });
      } else {
        res.status(401).json(result);
      }

    } catch (error) {
      logger.error('Email login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/login/wallet:
   *   post:
   *     tags: [Authentication]
   *     summary: Login merchant with wallet signature
   *     description: Authenticate merchant using Stacks wallet signature
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WalletAuthRequest'
   *     responses:
   *       200:
   *         description: Wallet login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Wallet authentication failed
   */
  async loginWithWallet(req: Request, res: Response): Promise<void> {
    try {
      const ipAddress = getClientIpAddress(req);
      const userAgent = req.get('User-Agent') || '';
      const walletData: WalletAuthRequest = req.body;

      // Validate wallet auth fields
      if (!walletData.address || !walletData.signature || !walletData.message || !walletData.publicKey) {
        res.status(400).json({
          success: false,
          error: 'Missing required wallet fields: address, signature, message, publicKey'
        });
        return;
      }

      // Verify wallet signature
      const walletVerification = await walletAuthService.verifyWalletConnection(walletData);
      
      if (!walletVerification.success || !walletVerification.verified) {
        res.status(401).json({
          success: false,
          error: walletVerification.error || 'Wallet authentication failed'
        });
        return;
      }

      // Find merchant by Stacks address
      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findOne({ stacksAddress: walletData.address });

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'No merchant account found for this wallet address. Please register first.'
        });
        return;
      }

      // Create session for wallet-authenticated merchant
      const sessionInfo = await sessionService.createSession(
        merchant._id.toString(),
        ipAddress,
        userAgent,
        true, // rememberMe for wallet logins
        undefined // deviceFingerprint
      );

      // Generate JWT tokens using the authService method
      const tokenResult = await (authService as any).createJWTTokens(
        merchant, 
        sessionInfo.sessionId,
        true // rememberMe
      );

      logger.info('Merchant logged in via wallet', {
        merchantId: merchant._id.toString(),
        stacksAddress: walletData.address,
        walletType: walletData.walletType
      });

      res.json({
        success: true,
        token: tokenResult.token,
        refreshToken: tokenResult.refreshToken,
        merchant: {
          id: merchant._id.toString(),
          name: merchant.name,
          email: merchant.email,
          stacksAddress: merchant.stacksAddress,
          emailVerified: merchant.emailVerified,
          verificationLevel: merchant.verificationLevel || 'none',
          businessType: merchant.businessType,
          profileComplete: true, // Existing users should have complete profiles
        },
        authMethod: 'wallet',
        walletConnected: true
      });

    } catch (error) {
      logger.error('Wallet login error:', error);
      res.status(500).json({
        success: false,
        error: 'Wallet login failed. Please try again.'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/connect-wallet:
   *   post:
   *     tags: [Wallet Authentication]
   *     summary: Connect wallet to existing user account
   *     description: Connect a wallet to an existing user account that was created with email
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - address
   *               - signature
   *               - message
   *               - publicKey
   *             properties:
   *               address:
   *                 type: string
   *                 description: Wallet address
   *               signature:
   *                 type: string
   *                 description: Signature of the challenge message
   *               message:
   *                 type: string
   *                 description: The challenge message that was signed
   *               publicKey:
   *                 type: string
   *                 description: Public key of the wallet
   *               walletType:
   *                 type: string
   *                 enum: [stacks, bitcoin]
   *                 description: Type of wallet
   *     responses:
   *       200:
   *         description: Wallet connected successfully
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
   *                   example: "Wallet connected successfully"
   *                 merchant:
   *                   $ref: '#/components/schemas/MerchantProfile'
   *       400:
   *         description: Invalid wallet data or wallet already connected to another account
   *       401:
   *         description: Wallet signature verification failed
   *       500:
   *         description: Server error
   */
  async connectWallet(req: Request, res: Response): Promise<void> {
    try {
      const walletData: WalletAuthRequest = req.body;
      const merchantId = req.merchant?.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Validate wallet auth fields
      if (!walletData.address || !walletData.signature || !walletData.message || !walletData.publicKey) {
        res.status(400).json({
          success: false,
          error: 'Missing required wallet fields: address, signature, message, publicKey'
        });
        return;
      }

      // Verify wallet signature
      const walletVerification = await walletAuthService.verifyWalletConnection(walletData);
      
      if (!walletVerification.success || !walletVerification.verified) {
        res.status(401).json({
          success: false,
          error: walletVerification.error || 'Wallet signature verification failed'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      
      // Check if this wallet is already connected to another account
      const existingWalletMerchant = await Merchant.findOne({ 
        stacksAddress: walletData.address,
        _id: { $ne: merchantId } // Not the current user
      });

      if (existingWalletMerchant) {
        res.status(400).json({
          success: false,
          error: 'This wallet address is already connected to another account'
        });
        return;
      }

      // Get current merchant
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      // Update merchant with wallet information
      merchant.stacksAddress = walletData.address;
      merchant.walletConnected = true;
      merchant.walletType = walletData.walletType || 'stacks';
      
      // Mark wallet as explicitly connected
      if (!merchant.connectedWallets) {
        merchant.connectedWallets = {};
      }
      merchant.connectedWallets.stacks = {
        address: walletData.address,
        connected: true,
        connectedAt: new Date()
      };

      await merchant.save();

      logger.info('Wallet connected to existing account', {
        merchantId: merchant._id.toString(),
        stacksAddress: walletData.address,
        walletType: walletData.walletType
      });

      res.json({
        success: true,
        message: 'Wallet connected successfully',
        merchant: {
          id: merchant._id.toString(),
          name: merchant.name,
          email: merchant.email,
          stacksAddress: merchant.stacksAddress,
          walletConnected: merchant.walletConnected,
          walletType: merchant.walletType,
          connectedWallets: merchant.connectedWallets
        }
      });

    } catch (error) {
      logger.error('Connect wallet error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect wallet. Please try again.'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: Logout merchant
   *     description: Invalidate current session and logout
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
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
   *                   example: Logged out successfully
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const sessionId = req.sessionData?.sessionId || (req.session as any)?.sessionId;

      if (!merchantId || !sessionId) {
        res.status(401).json({
          success: false,
          error: 'No active session found'
        });
        return;
      }

      const ipAddress = getClientIpAddress(req);
      const result = await authService.logout(merchantId, sessionId, ipAddress);

      if (result.success) {
        logger.info('Merchant logged out', { merchantId, sessionId });
        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Logout failed'
        });
      }

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed. Please try again.'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/wallet/challenge:
   *   get:
   *     tags: [Wallet Authentication]
   *     summary: Generate wallet challenge message
   *     description: Generate a challenge message for wallet signature authentication
   *     parameters:
   *       - in: query
   *         name: address
   *         required: true
   *         schema:
   *           type: string
   *         description: Stacks wallet address
   *       - in: query
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [connection, payment]
   *         description: Type of challenge (connection or payment)
   *       - in: query
   *         name: paymentId
   *         schema:
   *           type: string
   *         description: Payment ID (required for payment type)
   *       - in: query
   *         name: amount
   *         schema:
   *           type: number
   *         description: Payment amount in satoshis (required for payment type)
   *     responses:
   *       200:
   *         description: Challenge generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 challenge:
   *                   type: string
   *                   description: Message to be signed by wallet
   *                 expiresAt:
   *                   type: string
   *                   format: date-time
   *                   description: Challenge expiration time
   */
  async generateWalletChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { address, type, paymentId, amount } = req.query;

      if (!address || !type) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: address, type'
        });
        return;
      }

      let challenge: string;
      
      if (type === 'payment') {
        if (!paymentId || !amount) {
          res.status(400).json({
            success: false,
            error: 'Payment challenges require paymentId and amount'
          });
          return;
        }
        challenge = walletAuthService.generateChallengeMessage(
          paymentId as string, 
          parseInt(amount as string)
        );
      } else if (type === 'connection') {
        challenge = walletAuthService.generateConnectionChallenge(address as string);
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid challenge type. Must be "connection" or "payment"'
        });
        return;
      }

      const expiresAt = new Date(Date.now() + (type === 'payment' ? 5 * 60 * 1000 : 10 * 60 * 1000));

      res.json({
        success: true,
        challenge,
        expiresAt,
        type
      });

    } catch (error) {
      logger.error('Wallet challenge generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate wallet challenge'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/wallet/verify:
   *   post:
   *     tags: [Wallet Authentication]
   *     summary: Verify wallet signature
   *     description: Verify wallet signature for payment authorization or connection
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WalletAuthRequest'
   *     responses:
   *       200:
   *         description: Wallet verification result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 verified:
   *                   type: boolean
   *                 address:
   *                   type: string
   *                 paymentMethod:
   *                   type: string
   *                 error:
   *                   type: string
   */
  async verifyWalletSignature(req: Request, res: Response): Promise<void> {
    try {
      const walletData: WalletAuthRequest = req.body;

      // Validate wallet verification fields
      if (!walletData.address || !walletData.signature || !walletData.message || !walletData.publicKey) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: address, signature, message, publicKey'
        });
        return;
      }

      // Use wallet auth service for verification
      const result = await walletAuthService.verifyWalletSignature(walletData);

      logger.info('Wallet signature verification completed', {
        address: walletData.address,
        verified: result.verified,
        walletType: walletData.walletType,
        paymentId: walletData.paymentId
      });

      res.json(result);

    } catch (error) {
      logger.error('Wallet verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Wallet verification failed. Please try again.'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/api-keys:
   *   get:
   *     tags: [API Keys]
   *     summary: Get merchant API keys
   *     description: List all active API keys for authenticated merchant
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: API keys retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       keyId:
   *                         type: string
   *                       keyPreview:
   *                         type: string
   *                       permissions:
   *                         type: array
   *                         items:
   *                           type: string
   *                       environment:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       lastUsed:
   *                         type: string
   *                         format: date-time
   *   post:
   *     tags: [API Keys]
   *     summary: Generate new API key
   *     description: Create a new API key for merchant
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - permissions
   *               - environment
   *             properties:
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [read, write, webhooks]
   *               environment:
   *                 type: string
   *                 enum: [test, live]
   *     responses:
   *       201:
   *         description: API key created successfully
   */
  async getApiKeys(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const apiKeys = await authService.getMerchantApiKeys(merchantId);

      res.json({
        success: true,
        data: apiKeys
      });

    } catch (error) {
      logger.error('Get API keys error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve API keys'
      });
    }
  }

  async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const { permissions, environment } = req.body;

      if (!permissions || !Array.isArray(permissions) || !environment) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: permissions (array), environment'
        });
        return;
      }

      const apiKeyData = {
        name: req.body.name || `API Key ${new Date().toISOString()}`,
        permissions,
        environment,
        ipRestrictions: req.body.ipRestrictions || [],
        rateLimit: req.body.rateLimit,
        expiresAt: req.body.expiresAt,
      };

      const apiKey = await authService.generateApiKey(merchantId, apiKeyData);

      logger.info('API key created', {
        merchantId,
        keyId: apiKey.keyId,
        environment,
        permissions
      });

      res.status(201).json({
        success: true,
        data: apiKey
      });

    } catch (error) {
      logger.error('Create API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create API key'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/api-keys/{keyId}:
   *   delete:
   *     tags: [API Keys]
   *     summary: Revoke API key
   *     description: Revoke an active API key
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: keyId
   *         required: true
   *         schema:
   *           type: string
   *         description: API key ID to revoke
   *     responses:
   *       200:
   *         description: API key revoked successfully
   */
  async revokeApiKey(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { keyId } = req.params;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const result = await authService.revokeApiKey(merchantId, keyId);

      if (result.success) {
        logger.info('API key revoked', { merchantId, keyId });
        res.json({
          success: true,
          message: 'API key revoked successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to revoke API key'
        });
      }

    } catch (error) {
      logger.error('Revoke API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke API key'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/api-keys/{keyId}/rotate:
   *   post:
   *     tags: [API Keys]
   *     summary: Rotate API key
   *     description: Generate a new API key and set grace period for old key
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: keyId
   *         required: true
   *         schema:
   *           type: string
   *         description: API key ID to rotate
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               gracePeriodHours:
   *                 type: number
   *                 default: 24
   *                 description: Hours to keep old key active
   *     responses:
   *       200:
   *         description: API key rotated successfully
   */
  async rotateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { keyId } = req.params;
      const { gracePeriodHours = 24 } = req.body;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Merchant authentication required'
        });
        return;
      }

      const result = await authService.rotateApiKey(merchantId, keyId, gracePeriodHours);

      if (result.success) {
        logger.info('API key rotated', { 
          merchantId, 
          oldKeyId: keyId, 
          newKeyId: result.newKey?.keyId,
          gracePeriodHours 
        });
        
        res.json({
          success: true,
          data: {
            newKey: result.newKey?.keyPreview,
            fullKey: result.newKey?.key, // Only shown once
            gracePeriod: gracePeriodHours,
            expiresAt: result.oldKeyExpiresAt,
            message: `Old key will remain active for ${gracePeriodHours} hours`
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to rotate API key'
        });
      }

    } catch (error) {
      logger.error('Rotate API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to rotate API key'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     tags: [Authentication]
   *     summary: Get current merchant info
   *     description: Get authenticated merchant information
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Merchant info retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     email:
   *                       type: string
   *                     stacksAddress:
   *                       type: string
   *                     emailVerified:
   *                       type: boolean
   *                     walletSetup:
   *                       type: object
   */
  async getCurrentMerchant(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const walletStatus = await authService.getWalletSetupStatus(merchantId);

      res.json({
        success: true,
        data: {
          ...req.merchant,
          walletSetup: walletStatus
        }
      });

    } catch (error) {
      logger.error('Get current merchant error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve merchant information'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/verify-email:
   *   post:
   *     tags: [Authentication]
   *     summary: Verify email address with token
   *     description: Verify merchant email address using verification token sent via email
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *                 description: Email verification token
   *             required:
   *               - token
   *     responses:
   *       200:
   *         description: Email verification successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid or expired token
   *       500:
   *         description: Server error
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
        return;
      }

      const result = await authService.verifyEmail({ token });

      if (result.success) {
        res.json({
          success: true,
          message: 'Email verified successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/resend-verification:
   *   post:
   *     tags: [Authentication]
   *     summary: Resend email verification
   *     description: Resend verification email to the merchant
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
   *         description: Verification email sent successfully
   *       400:
   *         description: Email already verified or invalid
   *       500:
   *         description: Server error
   */
  async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      logger.info('Resend verification request received', { email });

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      const result = await authService.resendEmailVerification(email);

      if (result.success) {
        logger.info('Verification email resent successfully', { email });
        res.json({
          success: true,
          message: 'Verification email sent successfully'
        });
      } else {
        logger.warn('Resend verification failed', { email, error: result.error });
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend verification email'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     tags: [Profile]
   *     summary: Get merchant profile
   *     description: Get complete merchant profile information
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *   put:
   *     tags: [Profile]
   *     summary: Update merchant profile
   *     description: Update merchant profile information
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               businessDescription:
   *                 type: string
   *               website:
   *                 type: string
   *               phone:
   *                 type: string
   *               address:
   *                 type: string
   *               city:
   *                 type: string
   *               postalCode:
   *                 type: string
   *               country:
   *                 type: string
   *               taxId:
   *                 type: string
   *               timezone:
   *                 type: string
   *               language:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(merchantId);

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: merchant._id.toString(),
          name: merchant.name,
          email: merchant.email,
          businessType: merchant.businessType,
          website: merchant.website,
          businessDescription: merchant.businessDescription,
          phone: merchant.phone,
          address: merchant.address,
          city: merchant.city,
          postalCode: merchant.postalCode,
          country: merchant.country,
          taxId: merchant.taxId,
          timezone: merchant.timezone,
          language: merchant.language,
          emailVerified: merchant.emailVerified,
          verificationLevel: merchant.verificationLevel,
          stacksAddress: merchant.stacksAddress,
          authMethod: merchant.authMethod,
          createdAt: merchant.createdAt,
          updatedAt: merchant.updatedAt
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve profile'
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const updateData = req.body;
      const { Merchant } = await import('@/models/merchant/Merchant');

      // Validate email if being updated
      if (updateData.email && updateData.email !== req.merchant?.email) {
        const existingMerchant = await Merchant.findOne({ 
          email: updateData.email.toLowerCase(),
          _id: { $ne: merchantId }
        });
        
        if (existingMerchant) {
          res.status(400).json({
            success: false,
            error: 'Email already in use by another account'
          });
          return;
        }
      }

      const merchant = await Merchant.findByIdAndUpdate(
        merchantId,
        {
          $set: {
            ...(updateData.name && { name: updateData.name.trim() }),
            ...(updateData.email && { email: updateData.email.toLowerCase().trim() }),
            ...(updateData.businessDescription && { businessDescription: updateData.businessDescription }),
            ...(updateData.website && { website: updateData.website }),
            ...(updateData.phone && { phone: updateData.phone }),
            ...(updateData.address && { address: updateData.address }),
            ...(updateData.city && { city: updateData.city }),
            ...(updateData.postalCode && { postalCode: updateData.postalCode }),
            ...(updateData.country && { country: updateData.country }),
            ...(updateData.taxId && { taxId: updateData.taxId }),
            ...(updateData.timezone && { timezone: updateData.timezone }),
            ...(updateData.language && { language: updateData.language })
          }
        },
        { new: true }
      );

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      logger.info('Merchant profile updated', {
        merchantId,
        fieldsUpdated: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: merchant._id.toString(),
          name: merchant.name,
          email: merchant.email,
          businessType: merchant.businessType,
          website: merchant.website,
          businessDescription: merchant.businessDescription,
          phone: merchant.phone,
          address: merchant.address,
          city: merchant.city,
          postalCode: merchant.postalCode,
          country: merchant.country,
          taxId: merchant.taxId,
          timezone: merchant.timezone,
          language: merchant.language,
          emailVerified: merchant.emailVerified,
          verificationLevel: merchant.verificationLevel,
          stacksAddress: merchant.stacksAddress,
          authMethod: merchant.authMethod,
          updatedAt: merchant.updatedAt
        }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/settings:
   *   get:
   *     tags: [Settings]
   *     summary: Get merchant settings
   *     description: Get merchant payment and notification preferences
   *     security:
   *       - bearerAuth: []
   *   put:
   *     tags: [Settings]
   *     summary: Update merchant settings
   *     description: Update merchant preferences and configuration
   *     security:
   *       - bearerAuth: []
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(merchantId);

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          paymentPreferences: merchant.paymentPreferences,
          sbtcSettings: merchant.sbtcSettings,
          notificationPreferences: merchant.notificationPreferences,
          twoFactorEnabled: merchant.twoFactorEnabled,
          walletSetup: merchant.walletSetup,
          webhookUrl: merchant.webhookUrl,
          webhookEvents: merchant.webhookEvents || [],
          // Add wallet balances and connected wallet data
          walletBalances: merchant.walletBalances || {
            stxBalance: { amount: '0', lastUpdated: new Date() },
            btcBalance: { amount: '0', lastUpdated: new Date() },
            sbtcBalance: { amount: '0', lastUpdated: new Date() },
          },
          connectedWallets: {
            stacksAddress: merchant.connectedWallets?.stacksAddress || merchant.stacksAddress,
            bitcoinAddress: merchant.connectedWallets?.bitcoinAddress || merchant.bitcoinAddress,
            walletType: merchant.connectedWallets?.walletType,
            lastConnected: merchant.connectedWallets?.lastConnected,
          },
        }
      });

    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve settings'
      });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { 
        paymentPreferences,
        sbtcSettings,
        notificationPreferences,
        webhookUrl,
        webhookEvents
      } = req.body;

      const { Merchant } = await import('@/models/merchant/Merchant');
      
      const updateFields: any = {};
      
      if (paymentPreferences) {
        updateFields.paymentPreferences = paymentPreferences;
      }
      
      if (sbtcSettings) {
        updateFields.sbtcSettings = sbtcSettings;
      }
      
      if (notificationPreferences) {
        updateFields.notificationPreferences = notificationPreferences;
      }

      if (webhookUrl !== undefined) {
        updateFields.webhookUrl = webhookUrl;
      }

      if (webhookEvents !== undefined) {
        updateFields.webhookEvents = webhookEvents;
      }

      const merchant = await Merchant.findByIdAndUpdate(
        merchantId,
        { $set: updateFields },
        { new: true }
      );

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      logger.info('Merchant settings updated', {
        merchantId,
        fieldsUpdated: Object.keys(updateFields)
      });

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: {
          paymentPreferences: merchant.paymentPreferences,
          sbtcSettings: merchant.sbtcSettings,
          notificationPreferences: merchant.notificationPreferences,
          twoFactorEnabled: merchant.twoFactorEnabled,
          walletSetup: merchant.walletSetup
        }
      });

    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settings'
      });
    }
  }

  // Two-Factor Authentication endpoints
  async enable2FA(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      if (merchant.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          error: '2FA is already enabled'
        });
        return;
      }

      const speakeasy = require('speakeasy');
      const secret = speakeasy.generateSecret({
        name: `sBTC Payment Gateway - ${merchant.name}`,
        issuer: 'sBTC Payment Gateway'
      });

      merchant.twoFactorTempSecret = secret.base32;
      await merchant.save();

      res.json({
        success: true,
        data: {
          secret: secret.base32,
          qrCode: secret.otpauth_url
        }
      });
    } catch (error) {
      logger.error('Enable 2FA error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enable 2FA'
      });
    }
  }

  async confirm2FA(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { token } = req.body;

      if (!merchantId || !token) {
        res.status(400).json({
          success: false,
          error: 'Merchant ID and token required'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(merchantId);
      if (!merchant || !merchant.twoFactorTempSecret) {
        res.status(404).json({
          success: false,
          error: 'Setup not found'
        });
        return;
      }

      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: merchant.twoFactorTempSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        res.status(400).json({
          success: false,
          error: 'Invalid verification code'
        });
        return;
      }

      // Generate backup codes
      const crypto = require('crypto');
      const backupCodes = Array.from({ length: 10 }, () => ({
        code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        used: false,
        createdAt: new Date()
      }));

      merchant.twoFactorEnabled = true;
      merchant.twoFactorSecret = merchant.twoFactorTempSecret;
      merchant.twoFactorTempSecret = undefined;
      merchant.twoFactorBackupCodes = backupCodes;
      await merchant.save();

      res.json({
        success: true,
        data: {
          backupCodes: backupCodes.map(bc => bc.code)
        }
      });
    } catch (error) {
      logger.error('Confirm 2FA error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to confirm 2FA'
      });
    }
  }

  async disable2FA(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { password, twoFactorCode } = req.body;

      if (!merchantId || (!password && !twoFactorCode)) {
        res.status(400).json({
          success: false,
          error: 'Password or 2FA code required'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      if (!merchant.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          error: '2FA is not enabled'
        });
        return;
      }

      // Verify password or 2FA code
      let verified = false;
      
      if (password && merchant.passwordHash) {
        const bcrypt = require('bcrypt');
        verified = await bcrypt.compare(password, merchant.passwordHash);
      } else if (twoFactorCode && merchant.twoFactorSecret) {
        const speakeasy = require('speakeasy');
        verified = speakeasy.totp.verify({
          secret: merchant.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2
        });
      }

      if (!verified) {
        res.status(400).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      merchant.twoFactorEnabled = false;
      merchant.twoFactorSecret = undefined;
      merchant.twoFactorBackupCodes = [];
      await merchant.save();

      res.json({
        success: true,
        message: '2FA has been disabled'
      });
    } catch (error) {
      logger.error('Disable 2FA error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disable 2FA'
      });
    }
  }

  // Password Management endpoints
  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { currentPassword, newPassword } = req.body;

      if (!merchantId || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Merchant ID and new password required'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      // Different validation for wallet vs email users
      if (merchant.authMethod === 'email' || merchant.hasUpdatedPassword) {
        // Email users or wallet users who have already updated password need to provide current password
        if (!currentPassword) {
          res.status(400).json({
            success: false,
            error: 'Current password required'
          });
          return;
        }

        // Verify current password
        const bcrypt = require('bcrypt');
        const isValidPassword = await bcrypt.compare(currentPassword, merchant.passwordHash);
        if (!isValidPassword) {
          res.status(400).json({
            success: false,
            error: 'Current password is incorrect'
          });
          return;
        }
      }

      // Hash new password
      const bcrypt = require('bcrypt');
      const newPasswordHash = await bcrypt.hash(newPassword, 14);

      // Update password and clear generated password
      merchant.passwordHash = newPasswordHash;
      merchant.hasUpdatedPassword = true;
      merchant.generatedPassword = undefined; // Clear generated password once updated
      await merchant.save();

      // Send security notification email
      if (merchant.email && merchant.notificationPreferences.securityAlerts) {
        const wasGenerated = !merchant.hasUpdatedPassword;
        await this.sendPasswordChangeNotification(merchant.email, merchant.name, req, wasGenerated);
      }

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      logger.error('Update password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }
  }

  async getGeneratedPassword(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { Merchant } = await import('@/models/merchant/Merchant');
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      // Only show generated password for wallet users who haven't updated it yet
      if (merchant.authMethod === 'wallet' && !merchant.hasUpdatedPassword && merchant.generatedPassword) {
        res.json({
          success: true,
          data: {
            generatedPassword: merchant.generatedPassword,
            hasUpdatedPassword: merchant.hasUpdatedPassword
          }
        });
      } else {
        res.json({
          success: true,
          data: {
            generatedPassword: null,
            hasUpdatedPassword: merchant.hasUpdatedPassword
          }
        });
      }
    } catch (error) {
      logger.error('Get generated password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve generated password'
      });
    }
  }

  private async sendPasswordChangeNotification(
    email: string, 
    name: string, 
    req: Request, 
    wasGenerated: boolean = false
  ): Promise<void> {
    try {
      await emailService.sendPasswordChangedEmail(email, {
        merchantName: name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        wasGenerated,
      });
      
      logger.info('Password change notification sent successfully', {
        email,
        name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to send password change notification:', error);
    }
  }

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
  async updateEmail(req: Request, res: Response): Promise<void> {
    try {
      console.log('UpdateEmail endpoint hit');
      const merchantId = req.merchant?.id;
      const { email } = req.body;

      console.log('UpdateEmail request received:', { 
        merchantId, 
        email, 
        hasReqMerchant: !!req.merchant,
        reqBody: req.body,
        headers: req.headers.authorization ? 'Authorization header present' : 'No auth header'
      });

      logger.info('UpdateEmail request received', { 
        merchantId, 
        email, 
        hasReqMerchant: !!req.merchant,
        reqBody: req.body 
      });

      if (!merchantId) {
        console.log('UpdateEmail: No merchant ID found');
        logger.warn('UpdateEmail: No merchant ID found');
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      if (!email || typeof email !== 'string') {
        console.log('UpdateEmail: Invalid email provided:', email);
        logger.warn('UpdateEmail: Invalid email provided', { email });
        res.status(400).json({
          success: false,
          error: 'Valid email is required'
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('UpdateEmail: Invalid email format:', email);
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      console.log('Email format validation passed');

      // Get current merchant
      console.log('Getting current merchant...');
      const merchant = await merchantService.getMerchant(merchantId);
      console.log('Current merchant found:', merchant ? 'Yes' : 'No');
      
      if (!merchant) {
        console.log('UpdateEmail: Merchant not found');
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      // Check if email is already in use by another merchant
      console.log('Checking if email exists for another merchant...');
      const existingMerchant = await merchantService.getMerchantByEmail(email);
      console.log('Existing merchant check result:', existingMerchant ? 'Found existing merchant' : 'No existing merchant');
      
      if (existingMerchant && existingMerchant.id !== merchantId) {
        console.log('UpdateEmail: Email already in use by another merchant');
        
        // Check if the accounts are already linked
        const { Merchant } = await import('@/models/merchant/Merchant');
        const currentMerchantDoc = await Merchant.findById(merchantId);
        const existingMerchantDoc = await Merchant.findById(existingMerchant.id);
        
        // Check if they are already linked
        const isAlreadyLinked = (
          currentMerchantDoc?.linkedAccounts?.some((linked: any) => linked.accountId === existingMerchant.id) ||
          existingMerchantDoc?.linkedAccounts?.some((linked: any) => linked.accountId === merchantId) ||
          currentMerchantDoc?.linkedToPrimary === existingMerchant.id ||
          existingMerchantDoc?.linkedToPrimary === merchantId
        );
        
        console.log('Accounts already linked:', isAlreadyLinked);
        
        if (isAlreadyLinked) {
          // If accounts are already linked, we can safely update the email
          // We need to update it on the account that should have the email (usually the primary one)
          console.log('Accounts are already linked, proceeding with email update...');
          
          // For linked accounts, update the primary account's email
          const primaryAccountId = currentMerchantDoc?.isLinkedAccount ? 
            currentMerchantDoc.linkedToPrimary : merchantId;
          
          console.log('Updating primary account ID:', primaryAccountId);
          
          // Generate email verification token
          const emailVerificationToken = crypto.randomBytes(32).toString('hex');
          
          // Update the primary account's email
          const updateResult = await merchantService.updateMerchant(primaryAccountId || merchantId, {
            email: email,
            emailVerified: false,
            emailVerificationToken: emailVerificationToken,
            requiresEmailVerification: false,
            lastLoginAt: new Date()
          } as any);
          
          if (!updateResult.success) {
            console.log('Failed to update primary account email');
            res.status(500).json({
              success: false,
              error: 'Failed to update email for linked accounts'
            });
            return;
          }
          
          // Send verification email
          try {
            await emailService.sendEmailVerificationEmail(email, {
              merchantName: updateResult.merchant?.name || merchant.name,
              verificationToken: emailVerificationToken
            });
            console.log('Verification email sent for linked account update');
          } catch (emailError) {
            console.log('Error sending verification email for linked account:', emailError);
          }
          
          res.json({
            success: true,
            message: 'Email updated successfully for linked accounts. Please check your inbox for verification.',
            data: {
              email: email,
              emailVerified: false
            }
          });
          return;
        }
        
        // If not linked, try to detect linking opportunities (but not for already linked accounts)
        const linkingSuggestions = await accountLinkingService.detectLinkableAccounts(
          merchantId,
          email,
          merchant.stacksAddress,
          merchant.name
        );
        
        console.log('Linking suggestions found:', linkingSuggestions.length);
        console.log('Existing merchant ID:', existingMerchant.id);
        
        const highConfidenceMatch = linkingSuggestions.find(
          suggestion => suggestion.id === existingMerchant.id && suggestion.confidence === 'high'
        );
        
        console.log('High confidence match found:', !!highConfidenceMatch);
        
        if (highConfidenceMatch) {
          console.log('Returning linking suggestion response');
          const response = {
            success: false,
            error: 'Email is already in use by another account',
            linkingSuggestion: {
              canLink: true,
              targetAccount: {
                id: existingMerchant.id,
                name: existingMerchant.name,
                authMethod: highConfidenceMatch.authMethod,
                email: existingMerchant.email
              },
              message: 'This email belongs to another account. Would you like to link these accounts together?'
            }
          };
          console.log('Response data:', JSON.stringify(response, null, 2));
          res.status(200).json(response);
          return;
        } else {
          console.log('Returning simple error response');
          res.status(400).json({
            success: false,
            error: 'Email is already in use by another account'
          });
          return;
        }
      }

      console.log('Email availability check passed');

      console.log('Current merchant email:', merchant.email);

      console.log('Current merchant email:', merchant.email);

      // Check if this is a placeholder email (GitHub/wallet user)
      const isPlaceholderEmail = merchant.email.includes('@github.local') || 
                                merchant.email.includes('@wallet.local') ||
                                !merchant.email;

      console.log('Is placeholder email:', isPlaceholderEmail);

      if (!isPlaceholderEmail && merchant.email === email) {
        console.log('UpdateEmail: Same email as current');
        res.status(400).json({
          success: false,
          error: 'This email is already associated with your account'
        });
        return;
      }

      console.log('Email duplication check passed');

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      console.log('Generated verification token');

      // Update merchant email and set as unverified
      console.log('Updating merchant with new email...');
      const updateResult = await merchantService.updateMerchant(merchantId, {
        email: email,
        emailVerified: false,
        emailVerificationToken: emailVerificationToken,
        requiresEmailVerification: false, // No longer needs email addition
        lastLoginAt: new Date()
      } as any);

      console.log('Update result:', updateResult.success ? 'Success' : 'Failed');

      if (!updateResult.success || !updateResult.merchant) {
        console.log('UpdateEmail: Update failed or no merchant returned');
        res.status(500).json({
          success: false,
          error: 'Failed to update email'
        });
        return;
      }

      console.log('Attempting to send verification email...');

      // Send verification email using emailService directly
      try {
        await emailService.sendEmailVerificationEmail(email, {
          merchantName: updateResult.merchant.name,
          verificationToken: emailVerificationToken
        });
        console.log('Verification email sent successfully');
        logger.info('Email updated and verification sent', {
          merchantId,
          newEmail: email,
          previousEmail: merchant.email
        });
      } catch (emailError) {
        console.log('Error sending verification email:', emailError);
        logger.error('Failed to send verification email after update:', emailError);
        // Don't fail the whole request if email sending fails
      }

      console.log('Sending successful response...');
      res.json({
        success: true,
        message: 'Email updated successfully. Please check your inbox for verification.',
        data: {
          email: email,
          emailVerified: false
        }
      });

      console.log('UpdateEmail: Completed successfully');

    } catch (error) {
      console.log('UpdateEmail: Caught error in main try/catch:', error);
      logger.error('Update email error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        merchantId: req.merchant?.id
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update email'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/accounts/suggest-links:
   *   get:
   *     summary: Get suggested account links for current user
   *     tags: [Account Linking]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Suggested account links retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 suggestions:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       email:
   *                         type: string
   *                       authMethod:
   *                         type: string
   *                       name:
   *                         type: string
   *                       confidence:
   *                         type: string
   *                         enum: [high, medium, low]
   *                       matchingFields:
   *                         type: array
   *                         items:
   *                           type: string
   */
  async getSuggestedLinks(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const merchant = await merchantService.getMerchant(merchantId);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found'
        });
        return;
      }

      const suggestions = await accountLinkingService.detectLinkableAccounts(
        merchantId,
        merchant.email,
        merchant.stacksAddress,
        merchant.name
      );

      res.json({
        success: true,
        suggestions
      });

    } catch (error) {
      logger.error('Get suggested links error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get suggested links'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/accounts/initiate-link:
   *   post:
   *     summary: Initiate account linking process
   *     tags: [Account Linking]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               targetAccountId:
   *                 type: string
   *                 description: ID of account to link with
   *             required:
   *               - targetAccountId
   *     responses:
   *       200:
   *         description: Account linking initiated
   */
  async initiateLinking(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { targetAccountId, targetEmail } = req.body;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!targetAccountId) {
        res.status(400).json({
          success: false,
          error: 'Target account ID is required'
        });
        return;
      }

      const result = await accountLinkingService.initiateLinking(
        merchantId,
        targetAccountId,
        'primary',
        targetEmail // Pass the target email if provided
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Account linking initiated. Please check your email for confirmation.',
          linkingToken: result.linkingToken,
          expiresAt: result.expiresAt
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Initiate linking error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate account linking'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/accounts/confirm-link:
   *   post:
   *     summary: Confirm account linking with token
   *     tags: [Account Linking]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               linkingToken:
   *                 type: string
   *                 description: Token received via email
   *             required:
   *               - linkingToken
   *     responses:
   *       200:
   *         description: Account linking confirmed
   */
  async confirmLinking(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { linkingToken } = req.body;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!linkingToken) {
        res.status(400).json({
          success: false,
          error: 'Linking token is required'
        });
        return;
      }

      const result = await accountLinkingService.confirmLinking(
        linkingToken,
        merchantId
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Accounts successfully linked',
          linkedAccount: result.linkedAccount
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Confirm linking error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to confirm account linking'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/accounts/linked:
   *   get:
   *     summary: Get all linked accounts for current user
   *     tags: [Account Linking]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Linked accounts retrieved
   */
  async getLinkedAccounts(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const linkedAccounts = await accountLinkingService.getLinkedAccounts(merchantId);

      res.json({
        success: true,
        linkedAccounts
      });

    } catch (error) {
      logger.error('Get linked accounts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get linked accounts'
      });
    }
  }

  /**
   * @swagger
   * /api/auth/accounts/unlink:
   *   post:
   *     summary: Unlink an account
   *     tags: [Account Linking]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               accountToUnlink:
   *                 type: string
   *             required:
   *               - accountToUnlink
   *     responses:
   *       200:
   *         description: Account unlinked successfully
   */
  async unlinkAccount(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.merchant?.id;
      const { accountToUnlink } = req.body;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!accountToUnlink) {
        res.status(400).json({
          success: false,
          error: 'Account to unlink is required'
        });
        return;
      }

      const result = await accountLinkingService.unlinkAccounts(
        merchantId,
        accountToUnlink
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Account unlinked successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Unlink account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlink account'
      });
    }
  }
}