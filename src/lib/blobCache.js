import { getStore } from "@netlify/blobs";

const CACHE_KEY = "rss-feeds-cache";
const STORE_NAME = "rss-cache";

// Cache timing configuration
const STALE_THRESHOLD = 15 * 60 * 1000; // 15 minutes - after this, serve stale + refresh
const EXPIRE_THRESHOLD = 30 * 60 * 1000; // 30 minutes - after this, must fetch fresh

/**
 * Get the Netlify Blobs store with error handling for local development
 */
function getBlobStore() {
  try {
    // Use strong consistency to ensure we always read the latest data
    return getStore({ name: STORE_NAME, consistency: "strong" });
  } catch (error) {
    console.warn("Netlify Blobs unavailable (local dev?):", error.message);
    return null;
  }
}

/**
 * Retrieve cached RSS feeds from Netlify Blobs
 * @returns {Promise<{data: object, timestamp: number, feedCount: number} | null>}
 */
export async function getCachedFeeds() {
  const store = getBlobStore();
  if (!store) return null;

  try {
    const cached = await store.get(CACHE_KEY, { type: "json" });
    if (!cached) {
      console.log("No cache found in Netlify Blobs");
      return null;
    }

    console.log(`Cache found: age=${Math.round((Date.now() - cached.timestamp) / 1000)}s, feeds=${cached.feedCount}`);
    return cached;
  } catch (error) {
    console.error("Error reading from Netlify Blobs:", error.message);
    return null;
  }
}

/**
 * Store RSS feeds in Netlify Blobs cache
 * @param {object} data - The RSS feed data to cache
 * @returns {Promise<boolean>} - True if cache was successfully written
 */
export async function setCachedFeeds(data) {
  const store = getBlobStore();
  if (!store) return false;

  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      feedCount: data.sources?.length || 0,
      version: "1.0",
    };

    await store.setJSON(CACHE_KEY, cacheEntry);
    console.log(`Cache written: ${cacheEntry.feedCount} feeds at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error("Error writing to Netlify Blobs:", error.message);
    return false;
  }
}

/**
 * Clear the RSS cache from Netlify Blobs
 * @returns {Promise<boolean>}
 */
export async function clearCache() {
  const store = getBlobStore();
  if (!store) return false;

  try {
    await store.delete(CACHE_KEY);
    console.log("Cache cleared from Netlify Blobs");
    return true;
  } catch (error) {
    console.error("Error clearing cache:", error.message);
    return false;
  }
}

/**
 * Check if the cache is stale (should trigger background refresh)
 * @param {number} timestamp - Cache timestamp
 * @returns {boolean}
 */
export function isCacheStale(timestamp) {
  return Date.now() - timestamp > STALE_THRESHOLD;
}

/**
 * Check if the cache is expired (must fetch fresh data)
 * @param {number} timestamp - Cache timestamp
 * @returns {boolean}
 */
export function isCacheExpired(timestamp) {
  return Date.now() - timestamp > EXPIRE_THRESHOLD;
}

/**
 * Get cache status information
 * @param {number} timestamp - Cache timestamp
 * @returns {{age: number, ageMinutes: number, isStale: boolean, isExpired: boolean}}
 */
export function getCacheStatus(timestamp) {
  const age = Date.now() - timestamp;
  return {
    age,
    ageMinutes: Math.round(age / 60000),
    isStale: age > STALE_THRESHOLD,
    isExpired: age > EXPIRE_THRESHOLD,
  };
}
