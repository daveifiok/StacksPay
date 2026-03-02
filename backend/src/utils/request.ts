/**
 * Request utilities for extracting client information
 * Professional handling of IP addresses and client metadata
 */

import { Request } from 'express';

/**
 * Extract the real client IP address from request
 * Handles various proxy scenarios and forwarded headers
 */
export function getClientIpAddress(req: Request): string {
  // Check for forwarded IP addresses (load balancers, proxies, CDNs)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const forwardedIps = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const firstIp = forwardedIps.split(',')[0].trim();
    if (isValidIpAddress(firstIp)) {
      return firstIp;
    }
  }

  // Check other common headers
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string' && isValidIpAddress(realIp)) {
    return realIp;
  }

  const clientIp = req.headers['x-client-ip'];
  if (clientIp && typeof clientIp === 'string' && isValidIpAddress(clientIp)) {
    return clientIp;
  }

  // Cloudflare specific
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp && typeof cfConnectingIp === 'string' && isValidIpAddress(cfConnectingIp)) {
    return cfConnectingIp;
  }

  // Fall back to Express's req.ip (requires trust proxy)
  if (req.ip && isValidIpAddress(req.ip)) {
    return req.ip;
  }

  // Last resort: connection remote address
  if (req.connection?.remoteAddress && isValidIpAddress(req.connection.remoteAddress)) {
    return req.connection.remoteAddress;
  }

  // If we still don't have a valid IP, this is a system issue
  throw new Error('Unable to determine client IP address from request');
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
export function isValidIpAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // Remove any leading/trailing whitespace
  ip = ip.trim();

  // Check for IPv4
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(ip)) {
    return true;
  }

  // Check for IPv6
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6CompressedRegex = /^((?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*)?)::((?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*)?)$/;
  
  if (ipv6Regex.test(ip) || ipv6CompressedRegex.test(ip)) {
    return true;
  }

  // Check for localhost variations
  if (ip === 'localhost' || ip === '::1' || ip === '127.0.0.1') {
    return true;
  }

  return false;
}

/**
 * Get client metadata from request for logging/security purposes
 */
export function getClientMetadata(req: Request): {
  ipAddress: string;
  userAgent?: string;
  acceptLanguage?: string;
  origin?: string;
  referer?: string;
} {
  const ipAddress = getClientIpAddress(req);
  
  return {
    ipAddress,
    userAgent: req.headers['user-agent'],
    acceptLanguage: req.headers['accept-language'],
    origin: req.headers.origin,
    referer: req.headers.referer
  };
}

/**
 * Sanitize IP address for logging (remove sensitive info)
 */
export function sanitizeIpForLogging(ip: string): string {
  if (!isValidIpAddress(ip)) {
    return '[INVALID_IP]';
  }

  // For IPv4, optionally mask last octet for privacy
  if (ip.includes('.') && !ip.startsWith('127.') && !ip.startsWith('10.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }

  // For IPv6, mask the last segment
  if (ip.includes(':') && ip !== '::1') {
    const parts = ip.split(':');
    parts[parts.length - 1] = 'xxxx';
    return parts.join(':');
  }

  // Return as-is for localhost and private IPs
  return ip;
}
