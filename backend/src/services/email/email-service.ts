import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EmailService');

interface EmailTemplate {
  subject: string;
  template: string;
}

interface EmailOptions {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private templatesPath: string;

  constructor() {
    // Handle both development (ts-node) and production (compiled) environments
    const isDevelopment = __dirname.includes('src');
    if (isDevelopment) {
      // Running from source with ts-node
      // __dirname is: /backend/src/services/email/
      // Need to go up to: /backend/src/templates/emails/
      this.templatesPath = path.join(__dirname, '../../templates/emails');
    } else {
      // Running from compiled dist - need to go back to project root then to src
      this.templatesPath = path.join(__dirname, '../../../src/templates/emails');
    }
    
    logger.info('Email service constructor:', {
      __dirname,
      isDevelopment,
      templatesPath: this.templatesPath,
      templateExists: fs.existsSync(this.templatesPath),
      accountLinkingExists: fs.existsSync(path.join(this.templatesPath, 'account-linking.ejs'))
    });
    
    this.initializeTransporter().catch(error => {
      logger.error('Failed to initialize email transporter:', error);
    });
  }

  private async initializeTransporter(): Promise<void> {
    // Use different SMTP providers based on environment
    const emailProvider = process.env.EMAIL_PROVIDER || 'ethereal';

    logger.info(`Initializing email service with provider: ${emailProvider}`);

    if (emailProvider === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
          user: process.env.GMAIL_USER || process.env.SMTP_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS, // Use app password, not regular password
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 20000, // 20 seconds
        rateLimit: 5, // Max 5 emails per rateDelta
      });

      logger.info('Gmail transporter configured successfully', {
        user: process.env.GMAIL_USER,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true
      });
    } else if (emailProvider === 'sendgrid') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000, // 1 second
        rateLimit: 14, // Max 14 emails per second (SendGrid limit)
      });
    } else if (emailProvider === 'mailgun') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILGUN_SMTP_USER,
          pass: process.env.MAILGUN_SMTP_PASS,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });
    } else {
      // Development mode - create test account using Ethereal
      await this.createTestAccount();
    }
  }

  private async createTestAccount(): Promise<void> {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        pool: true,
        maxConnections: 1,
        rateDelta: 1000,
        rateLimit: 1,
      });

      logger.info('Development email account created', {
        user: testAccount.user,
        pass: testAccount.pass,
        previewUrl: 'https://ethereal.email/messages',
      });
    } catch (error) {
      logger.error('Failed to create test email account:', error);
      throw error;
    }
  }

  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);
      const basePath = path.join(this.templatesPath, 'base.ejs');

      logger.info('Rendering template:', {
        templateName,
        templatePath,
        basePath,
        templateExists: fs.existsSync(templatePath),
        baseExists: fs.existsSync(basePath),
        dataKeys: Object.keys(data)
      });

      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templateName} at ${templatePath}`);
      }

      if (!fs.existsSync(basePath)) {
        throw new Error(`Base template not found at ${basePath}`);
      }

      logger.info('Templates exist, rendering content...');

      // Render the specific template content
      const content = await ejs.renderFile(templatePath, {
        ...data,
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      });

      logger.info('Content template rendered successfully, rendering full HTML...');

      // Render the full email using base template
      const html = await ejs.renderFile(basePath, {
        title: data.title || 'sBTC Payment Gateway',
        content,
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        recipientEmail: data.recipientEmail || data.email,
      });

      logger.info('Full HTML template rendered successfully');
      return html;
    } catch (error: any) {
      logger.error('Template rendering failed:', {
        template: templateName,
        error: error.message,
        templatesPath: this.templatesPath,
        __dirname: __dirname
      });
      logger.error('Full error details:', error);
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    try {
      // Add rate limiting check
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const html = await this.renderTemplate(options.template.template, options.data);
      
      const mailOptions = {
        from: {
          name: 'sBTC Payment Gateway',
          address: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@sbtc-gateway.com',
        },
        to: options.to,
        subject: options.template.subject,
        html,
        // Add plain text version for better deliverability
        text: this.htmlToText(html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.template.subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info) || undefined,
      };

    } catch (error: any) {
      logger.error('Email sending failed:', {
        to: options.to,
        subject: options.template.subject,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Convenience methods for specific email types
  async sendWelcomeEmail(email: string, data: {
    merchantName: string;
    businessType: string;
    stacksAddress?: string;
    verificationToken: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: 'Welcome to sBTC Payment Gateway - Verify Your Email',
        template: 'welcome',
      },
      data: {
        ...data,
        email,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${data.verificationToken}`,
      },
    });
  }

  async sendEmailVerifiedNotification(email: string, data: {
    merchantName: string;
    testApiKey: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: 'Email Verified - Welcome to sBTC Payment Gateway!',
        template: 'email-verified',
      },
      data: {
        ...data,
        email,
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      },
    });
  }

  async sendPasswordResetEmail(email: string, data: {
    merchantName: string;
    resetToken: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: 'Reset Your sBTC Payment Gateway Password',
        template: 'password-reset',
      },
      data: {
        ...data,
        email,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${data.resetToken}`,
      },
    });
  }

  async send2FAEnabledEmail(email: string, data: {
    merchantName: string;
    backupCodes: string[];
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: 'Two-Factor Authentication Enabled',
        template: '2fa-enabled',
      },
      data: {
        ...data,
        email,
      },
    });
  }

  // Legacy method compatibility
  async sendEmailVerificationEmail(email: string, data: {
    merchantName: string;
    verificationToken: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendWelcomeEmail(email, {
      merchantName: data.merchantName,
      businessType: 'unknown',
      verificationToken: data.verificationToken,
    });
  }

  async send2FASetupEmail(email: string, data: {
    merchantName: string;
    backupCodes: string[];
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.send2FAEnabledEmail(email, data);
  }

  async sendSecurityAlert(email: string, merchantName: string, alertType: string, data: any): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: `Security Alert: ${alertType}`,
        template: 'security-alert',
      },
      data: {
        merchantName,
        alertType,
        email,
        ...data,
      },
    });
  }

  async sendLoginNotification(email: string, merchantName: string, ipAddress: string, userAgent: string): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: 'New Login to Your sBTC Payment Gateway Account',
        template: 'login-notification',
      },
      data: {
        merchantName,
        email,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });
  }

  async sendPasswordChangedEmail(email: string, data: {
    merchantName: string;
    ipAddress?: string;
    userAgent?: string;
    wasGenerated?: boolean;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: 'Password Changed - sBTC Payment Gateway',
        template: 'password-changed',
      },
      data: {
        ...data,
        email,
        timestamp: new Date(),
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      },
    });
  }

  async sendAccountLinkingEmail(email: string, data: {
    merchantName: string;
    primaryAccount: {
      businessName: string;
      email: string;
    };
    secondaryAccount: {
      businessName: string;
      email: string;
    };
    linkingMethod: string;
    confirmationToken: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      template: {
        subject: 'Account Linking Request - sBTC Payment Gateway',
        template: 'account-linking',
      },
      data: {
        ...data,
        email,
        recipientEmail: email, // Add this for base template compatibility
        confirmationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/link-accounts?token=${data.confirmationToken}`,
      },
    });
  }

  // Test email connectivity
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection test successful');
      return { success: true };
    } catch (error: any) {
      logger.error('Email service connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get email service status
  getStatus(): {
    provider: string;
    isConfigured: boolean;
    rateLimits?: {
      maxConnections: number;
      maxMessages: number;
      rateLimit: number;
      rateDelta: number;
    };
  } {
    const provider = process.env.EMAIL_PROVIDER || 'ethereal';
    
    return {
      provider,
      isConfigured: !!this.transporter,
      rateLimits: this.transporter?.options ? {
        maxConnections: (this.transporter.options as any).maxConnections || 1,
        maxMessages: (this.transporter.options as any).maxMessages || 100,
        rateLimit: (this.transporter.options as any).rateLimit || 1,
        rateDelta: (this.transporter.options as any).rateDelta || 1000,
      } : undefined,
    };
  }
}

export const emailService = new EmailService();