import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(request: NextRequest, identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    message?: string;
  }> {
    const now = Date.now();
    const key = `${identifier}:${request.ip || 'unknown'}`;
    
    const current = rateLimitStore[key];
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }
    
    if (current.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        message: this.config.message
      };
    }
    
    // Increment count
    current.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - current.count,
      resetTime: current.resetTime
    };
  }
}

// Pre-configured rate limiters
export const registrationRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 registration attempts per 15 minutes
  message: 'Too many registration attempts. Please try again later.'
});

export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes (more restrictive)
  message: 'Too many login attempts. Please try again later.'
});

export const forgotPasswordRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 forgot password attempts per hour
  message: 'Too many password reset requests. Please try again later.'
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 API requests per minute
  message: 'Too many requests. Please try again later.'
});

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 60 * 1000); // Clean up every minute 