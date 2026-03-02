import express from 'express';
import { emailService } from '@/services/email/email-service';
import { asyncHandler } from '@/middleware/error.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/test/email:
 *   post:
 *     summary: Test email configuration
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Email address to send test email to
 *             required:
 *               - to
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Email sending failed
 */
router.post('/email', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({
      success: false,
      error: 'Email address is required'
    });
  }

  // Test connection first
  const connectionTest = await emailService.testConnection();
  if (!connectionTest.success) {
    return res.status(500).json({
      success: false,
      error: 'Email service connection failed',
      details: connectionTest.error
    });
  }

  // Send test email
  const result = await emailService.sendWelcomeEmail(to, {
    merchantName: 'Test User',
    businessType: 'test',
    verificationToken: 'test-token-123'
  });

  if (result.success) {
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      previewUrl: result.previewUrl
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: result.error
    });
  }
}));

/**
 * @swagger
 * /api/test/email/status:
 *   get:
 *     summary: Get email service status
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Email service status
 */
router.get('/email/status', asyncHandler(async (req: express.Request, res: express.Response) => {
  const status = emailService.getStatus();
  const connectionTest = await emailService.testConnection();

  res.json({
    success: true,
    status: {
      ...status,
      connectionTest
    }
  });
}));

export default router;
