import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

// Types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

// Redis client singleton
let redisClient: Redis | IORedis | null = null;

/**
 * Get Redis client instance (singleton)
 * Supports both Upstash Redis (for Vercel) and local Redis (for development)
 */
export function getRedisClient(): Redis | IORedis | null {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Try Upstash Redis first (for Vercel production)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('✓ Connected to Upstash Redis');
      return redisClient;
    }

    // Fallback to local Redis (for development)
    if (process.env.REDIS_URL) {
      redisClient = new IORedis(process.env.REDIS_URL);
      console.log('✓ Connected to local Redis');
      return redisClient;
    }

    console.warn('⚠ Redis not configured - caching disabled');
    return null;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

/**
 * Cache wrapper with TTL support
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const redis = getRedisClient();
  const ttl = options.ttl || 300; // Default 5 minutes

  if (!redis) {
    // No cache - just fetch
    return fetcher();
  }

  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      return (typeof cached === 'string' ? JSON.parse(cached) : cached) as T;
    }

    // Fetch and cache
    const data = await fetcher();
    
    // Set with TTL - handle both Upstash and IORedis
    try {
      if ('setex' in redis && typeof redis.setex === 'function') {
        // IORedis - use setex
        await (redis as any).setex(key, ttl, JSON.stringify(data));
      } else if ('expire' in redis && typeof redis.expire === 'function') {
        // Upstash Redis - use set + expire separately
        await redis.set(key, JSON.stringify(data));
        await (redis as any).expire(key, ttl);
      } else {
        // Fallback - just set without TTL
        await redis.set(key, JSON.stringify(data));
      }
    } catch (setError: any) {
      // If set fails, log but don't fail the request
      const errorMsg = setError?.message || setError?.toString() || String(setError);
      console.warn('Failed to cache data:', errorMsg);
    }
    
    return data;
  } catch (error: any) {
    // Better error handling
    const errorMessage = error?.message || error?.toString() || 'Unknown cache error';
    console.error('Cache error:', errorMessage, error);
    // Fallback to fetcher on cache error
    return fetcher();
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(keyPattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    if ('keys' in redis && typeof redis.keys === 'function') {
      // IORedis
      const keys = await redis.keys(keyPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else if ('del' in redis && typeof redis.del === 'function') {
      // Upstash - no keys() support, delete single key
      await redis.del(keyPattern);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Rate limiting using Redis
 */
export async function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const redis = getRedisClient();

  if (!redis) {
    // No rate limiting without Redis
    return { success: true, remaining: limit, reset: Date.now() + window * 1000 };
  }

  try {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    // Use sorted set for sliding window
    if ('zremrangebyscore' in redis && typeof redis.zremrangebyscore === 'function') {
      // IORedis
      const ioredis = redis as any;
      await ioredis.zremrangebyscore(key, 0, windowStart);
      const count = await ioredis.zcard(key);

      if (count >= limit) {
        const oldest = await ioredis.zrange(key, 0, 0, 'WITHSCORES');
        const reset = oldest[1] ? parseInt(oldest[1] as string) + window * 1000 : now + window * 1000;
        return { success: false, remaining: 0, reset };
      }

      await ioredis.zadd(key, now, `${now}-${Math.random()}`);
      await ioredis.expire(key, window);

      return { success: true, remaining: limit - count - 1, reset: now + window * 1000 };
    } else {
      // Upstash - use simple counter with expire
      try {
        const upstash = redis as any;
        const count = await upstash.incr(key);
        
        // Set expire only on first increment
        if (count === 1) {
          await upstash.expire(key, window);
        }

        const success = count <= limit;
        return {
          success,
          remaining: Math.max(0, limit - count),
          reset: now + window * 1000
        };
      } catch (upstashError: any) {
        const errorMessage = upstashError?.message || upstashError?.toString() || 'Unknown error';
        console.error('Upstash rate limit error:', errorMessage);
        // Allow on error
        return { success: true, remaining: limit, reset: Date.now() + window * 1000 };
      }
    }
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    console.error('Rate limit error:', errorMessage);
    // Allow on error
    return { success: true, remaining: limit, reset: Date.now() + window * 1000 };
  }
}

/**
 * Session cache for JWT tokens
 */
export async function cacheSession(
  token: string,
  userId: number,
  ttl: number = 3600
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = `session:${token}`;
    if ('setex' in redis && typeof redis.setex === 'function') {
      // IORedis - use setex
      await (redis as any).setex(key, ttl, userId.toString());
    } else if ('expire' in redis && typeof redis.expire === 'function') {
      // Upstash Redis - use set + expire separately
      await redis.set(key, userId.toString());
      await (redis as any).expire(key, ttl);
    } else {
      // Fallback - just set without TTL
      await redis.set(key, userId.toString());
    }
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    console.error('Session cache error:', errorMessage);
  }
}

/**
 * Get cached session
 */
export async function getCachedSession(token: string): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = `session:${token}`;
    const userId = await redis.get(key);
    return userId ? parseInt(userId as string) : null;
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

/**
 * Invalidate session cache
 */
export async function invalidateSession(token: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = `session:${token}`;
    await redis.del(key);
  } catch (error) {
    console.error('Session invalidation error:', error);
  }
}

/**
 * Invalidate all user-related caches
 */
export async function invalidateUserCache(userId: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const patterns = [
      `projects:user:${userId}`,
      `tasks:user:${userId}*`,
      `stats:user:${userId}`,
    ];

    for (const pattern of patterns) {
      await invalidateCache(pattern);
    }
  } catch (error) {
    console.error('User cache invalidation error:', error);
  }
}
