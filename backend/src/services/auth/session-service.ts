import Redis from 'ioredis';
import crypto from 'crypto';
import { Merchant } from '@/models/merchant/Merchant';
import { connectToDatabase } from '@/config/database';

export interface SessionInfo {
  sessionId: string;
  merchantId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  location?: string;
  deviceFingerprint?: string;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  isMobile: boolean;
  fingerprint: string;
}

export class SessionService {
  private redis: Redis | null = null;
  private readonly SESSION_PREFIX = 'session:';
  private readonly DEVICE_PREFIX = 'device:';
  private readonly MAX_SESSIONS_PER_USER = 10;

  constructor() {
    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('Redis connected for session management');
      } catch (error) {
        console.warn('Redis connection failed, falling back to database sessions');
      }
    }
  }

  /**
   * Create a new session
   */
  async createSession(
    merchantId: string,
    ipAddress: string,
    userAgent: string,
    rememberMe: boolean = false,
    deviceFingerprint?: string
  ): Promise<SessionInfo> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    );

    const sessionInfo: SessionInfo = {
      sessionId,
      merchantId,
      ipAddress,
      userAgent,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      isActive: true,
      deviceFingerprint,
    };

    // Add location if possible (you could integrate with a geolocation service)
    try {
      sessionInfo.location = await this.getLocationFromIP(ipAddress);
    } catch (error) {
      console.warn('Failed to get location for IP:', ipAddress);
    }

    // Store in Redis if available, otherwise use database
    if (this.redis) {
      await this.storeSessionInRedis(sessionInfo);
    } else {
      await this.storeSessionInDatabase(sessionInfo);
    }

    // Clean up old sessions
    await this.cleanupOldSessions(merchantId);

    // Check for suspicious activity
    await this.checkSuspiciousActivity(merchantId, ipAddress, userAgent);

    return sessionInfo;
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    let sessionInfo: SessionInfo | null = null;

    // Try Redis first, then database
    if (this.redis) {
      sessionInfo = await this.getSessionFromRedis(sessionId);
    } else {
      sessionInfo = await this.getSessionFromDatabase(sessionId);
    }

    if (!sessionInfo || !sessionInfo.isActive || sessionInfo.expiresAt < new Date()) {
      return null;
    }

    // Update last activity
    sessionInfo.lastActivity = new Date();
    
    if (this.redis) {
      await this.storeSessionInRedis(sessionInfo);
    } else {
      await this.updateSessionInDatabase(sessionInfo);
    }

    return sessionInfo;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      if (this.redis) {
        await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
      }
      
      await this.revokeSessionInDatabase(sessionId);
      return true;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  }

  /**
   * Revoke all sessions for a merchant
   */
  async revokeAllSessions(merchantId: string, exceptSessionId?: string): Promise<boolean> {
    try {
      await connectToDatabase();
      
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return false;
      }

      // Filter out the exception session if provided
      const sessionsToRevoke = merchant.sessions.filter(
        (session: any) => session.sessionId !== exceptSessionId
      );

      // Revoke from Redis
      if (this.redis) {
        const pipeline = this.redis.pipeline();
        sessionsToRevoke.forEach((session: any) => {
          pipeline.del(`${this.SESSION_PREFIX}${session.sessionId}`);
        });
        await pipeline.exec();
      }

      // Update database
      if (exceptSessionId) {
        merchant.sessions = merchant.sessions.filter(
          (session: any) => session.sessionId === exceptSessionId
        );
      } else {
        merchant.sessions = [];
      }
      
      await merchant.save();
      return true;
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      return false;
    }
  }

  /**
   * Get all active sessions for a merchant
   */
  async getMerchantSessions(merchantId: string): Promise<SessionInfo[]> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return [];
      }

      const sessions = merchant.sessions
        .filter((session: any) => session.expiresAt > new Date())
        .map((session: any) => ({
          sessionId: session.sessionId,
          merchantId,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
          isActive: true,
          location: session.location,
          deviceFingerprint: session.deviceFingerprint,
        }));

      return sessions;
    } catch (error) {
      console.error('Error getting merchant sessions:', error);
      return [];
    }
  }

  /**
   * Detect device information from user agent
   */
  parseDeviceInfo(userAgent: string): DeviceInfo {
    const browser = this.detectBrowser(userAgent);
    const os = this.detectOS(userAgent);
    const device = this.detectDevice(userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    // Create a simple fingerprint (in production, use more sophisticated methods)
    const fingerprint = crypto
      .createHash('sha256')
      .update(userAgent + browser + os)
      .digest('hex')
      .substring(0, 16);

    return { browser, os, device, isMobile, fingerprint };
  }

  /**
   * Check for suspicious login activity
   */
  private async checkSuspiciousActivity(
    merchantId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const sessions = await this.getMerchantSessions(merchantId);
      
      // Check for multiple IPs
      const uniqueIPs = new Set(sessions.map(s => s.ipAddress));
      if (uniqueIPs.size > 3) {
        console.warn(`Suspicious activity: Multiple IPs for merchant ${merchantId}`);
        // Trigger security alert
      }

      // Check for rapid session creation
      const recentSessions = sessions.filter(
        s => s.createdAt.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
      );
      
      if (recentSessions.length > 3) {
        console.warn(`Suspicious activity: Rapid session creation for merchant ${merchantId}`);
        // Trigger security alert
      }

      // Check for unusual user agents
      const knownUserAgents = sessions.map(s => s.userAgent).slice(0, -1);
      if (knownUserAgents.length > 0 && !knownUserAgents.some(ua => 
        this.userAgentSimilarity(ua, userAgent) > 0.8
      )) {
        console.warn(`Suspicious activity: New device for merchant ${merchantId}`);
        // Could trigger email notification for new device
      }
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }

  /**
   * Store session in Redis
   */
  private async storeSessionInRedis(sessionInfo: SessionInfo): Promise<void> {
    if (!this.redis) return;
    
    const key = `${this.SESSION_PREFIX}${sessionInfo.sessionId}`;
    const ttl = Math.floor((sessionInfo.expiresAt.getTime() - Date.now()) / 1000);
    
    await this.redis.setex(key, ttl, JSON.stringify(sessionInfo));
  }

  /**
   * Get session from Redis
   */
  private async getSessionFromRedis(sessionId: string): Promise<SessionInfo | null> {
    if (!this.redis) return null;
    
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.redis.get(key);
    
    if (!data) return null;
    
    try {
      const sessionInfo = JSON.parse(data);
      sessionInfo.createdAt = new Date(sessionInfo.createdAt);
      sessionInfo.lastActivity = new Date(sessionInfo.lastActivity);
      sessionInfo.expiresAt = new Date(sessionInfo.expiresAt);
      return sessionInfo;
    } catch (error) {
      console.error('Error parsing session from Redis:', error);
      return null;
    }
  }

  /**
   * Store session in database (fallback)
   */
  private async storeSessionInDatabase(sessionInfo: SessionInfo): Promise<void> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(sessionInfo.merchantId);
      if (!merchant) return;

      // Remove old session if it exists
      merchant.sessions = merchant.sessions.filter(
        (session: any) => session.sessionId !== sessionInfo.sessionId
      );

      // Add new session
      merchant.sessions.push({
        sessionId: sessionInfo.sessionId,
        tokenHash: '', // Will be set by auth service
        createdAt: sessionInfo.createdAt,
        expiresAt: sessionInfo.expiresAt,
        lastActivity: sessionInfo.lastActivity,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
        location: sessionInfo.location,
        deviceFingerprint: sessionInfo.deviceFingerprint,
      });

      await merchant.save();
    } catch (error) {
      console.error('Error storing session in database:', error);
    }
  }

  /**
   * Get session from database
   */
  private async getSessionFromDatabase(sessionId: string): Promise<SessionInfo | null> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findOne({
        'sessions.sessionId': sessionId,
      });

      if (!merchant) return null;

      const session = merchant.sessions.find(
        (s: any) => s.sessionId === sessionId
      );

      if (!session) return null;

      return {
        sessionId: session.sessionId,
        merchantId: merchant._id.toString(),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        isActive: true,
        location: session.location,
        deviceFingerprint: session.deviceFingerprint,
      };
    } catch (error) {
      console.error('Error getting session from database:', error);
      return null;
    }
  }

  /**
   * Update session in database
   */
  private async updateSessionInDatabase(sessionInfo: SessionInfo): Promise<void> {
    await connectToDatabase();
    
    try {
      await Merchant.updateOne(
        { 
          _id: sessionInfo.merchantId,
          'sessions.sessionId': sessionInfo.sessionId,
        },
        {
          $set: {
            'sessions.$.lastActivity': sessionInfo.lastActivity,
          },
        }
      );
    } catch (error) {
      console.error('Error updating session in database:', error);
    }
  }

  /**
   * Revoke session in database
   */
  private async revokeSessionInDatabase(sessionId: string): Promise<void> {
    await connectToDatabase();
    
    try {
      await Merchant.updateOne(
        { 'sessions.sessionId': sessionId },
        { $pull: { sessions: { sessionId } } }
      );
    } catch (error) {
      console.error('Error revoking session in database:', error);
    }
  }

  /**
   * Clean up old expired sessions
   */
  private async cleanupOldSessions(merchantId: string): Promise<void> {
    await connectToDatabase();
    
    try {
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) return;

      const now = new Date();
      
      // Remove expired sessions
      merchant.sessions = merchant.sessions.filter(
        (session: any) => session.expiresAt > now
      );

      // Limit to max sessions per user
      if (merchant.sessions.length > this.MAX_SESSIONS_PER_USER) {
        merchant.sessions.sort((a: any, b: any) => b.lastActivity - a.lastActivity);
        merchant.sessions = merchant.sessions.slice(0, this.MAX_SESSIONS_PER_USER);
      }

      await merchant.save();
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }

  /**
   * Get approximate location from IP (placeholder - integrate with real service)
   */
  private async getLocationFromIP(ipAddress: string): Promise<string | undefined> {
    // In production, integrate with a service like MaxMind, IPGeolocation, etc.
    // For now, return a placeholder
    if (ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.')) {
      return 'Local Network';
    }
    return 'Unknown Location';
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown Browser';
  }

  /**
   * Detect OS from user agent
   */
  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  }

  /**
   * Detect device from user agent
   */
  private detectDevice(userAgent: string): string {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    return 'Desktop';
  }

  /**
   * Calculate user agent similarity (simple string similarity)
   */
  private userAgentSimilarity(ua1: string, ua2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w]/g, '');
    const norm1 = normalize(ua1);
    const norm2 = normalize(ua2);
    
    if (norm1 === norm2) return 1;
    
    // Simple Jaccard similarity
    const set1 = new Set(norm1.split(''));
    const set2 = new Set(norm2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
}

export const sessionService = new SessionService();
