interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const tracker = new Map<string, RateLimitRecord>();

// Periodic cleanup interval to prevent memory leaks
if (typeof globalThis !== 'undefined') {
  const intervalId = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(ip);
      }
    }
  }, 180000); // Clean every 3 minutes
  
  if (intervalId.unref) {
    intervalId.unref();
  }
}

export function isRateLimited(
  ip: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = tracker.get(ip);

  if (!record) {
    const resetTime = now + windowMs;
    tracker.set(ip, { count: 1, resetTime });
    return { success: true, limit, remaining: limit - 1, reset: resetTime };
  }

  if (now > record.resetTime) {
    const resetTime = now + windowMs;
    tracker.set(ip, { count: 1, resetTime });
    return { success: true, limit, remaining: limit - 1, reset: resetTime };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
}
