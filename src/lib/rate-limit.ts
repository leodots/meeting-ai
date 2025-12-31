/**
 * Simple in-memory rate limiter for self-hosted single-instance apps.
 * For distributed systems, use Redis instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  /**
   * Check if a request should be allowed
   * @param key - Unique identifier (e.g., IP address, user ID)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   */
  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // No existing entry or expired
    if (!entry || now >= entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        success: true,
        remaining: limit - 1,
        resetIn: Math.ceil(windowMs / 1000),
      };
    }

    // Entry exists and not expired
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetIn: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    // Increment count
    entry.count++;
    return {
      success: true,
      remaining: limit - entry.count,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  /**
   * Reset the rate limit for a key (e.g., after successful login)
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current count for a key (for monitoring)
   */
  getCount(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() >= entry.resetAt) {
      return 0;
    }
    return entry.count;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instances for different purposes
export const loginRateLimiter = new RateLimiter();
export const apiRateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  // Login: 5 attempts per 15 minutes per IP
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // API: 100 requests per minute per user
  api: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Upload: 10 uploads per hour per user
  upload: {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Process: 5 concurrent processing requests per user
  process: {
    limit: 5,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Helper to get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work in production behind proxy)
  return "unknown";
}

/**
 * Create rate limit response with proper headers
 */
export function rateLimitResponse(resetIn: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Please try again in ${resetIn} seconds`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(resetIn),
      },
    }
  );
}
