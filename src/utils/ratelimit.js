// Simple in-memory rate limiter
const requests = new Map();

/**
 * Check if a request should be rate limited
 * @param {string} key - Unique identifier (IP, user ID, or endpoint key)
 * @param {number} limit - Maximum requests allowed per window
 * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {boolean} - true if allowed, false if rate limit exceeded
 */
export function checkRateLimit(key, limit = 10, windowMs = 60000) {
  const now = Date.now();
  
  if (!requests.has(key)) {
    requests.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const data = requests.get(key);
  
  if (now > data.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (data.count >= limit) {
    return false;
  }
  
  data.count++;
  return true;
}

// Clean up expired records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requests.entries()) {
    if (now > data.resetTime) {
      requests.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes
