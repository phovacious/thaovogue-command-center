/**
 * Simple localStorage cache with stale-while-revalidate pattern.
 * Provides instant UI on startup with cached data, then refreshes in background.
 */

const CACHE_PREFIX = 'tcc_cache_';

// Default TTLs in milliseconds
const DEFAULT_TTLS = {
  '/api/health': 5 * 60 * 1000,           // 5 minutes
  '/api/market/clock': 1 * 60 * 1000,     // 1 minute
  '/api/crypto/status': 30 * 1000,        // 30 seconds
  '/api/crypto/trades': 60 * 1000,        // 1 minute
  '/api/equity/status': 30 * 1000,        // 30 seconds
  '/api/values-tab': 15 * 60 * 1000,      // 15 minutes
  '/api/value/dca-recommendation': 60 * 60 * 1000, // 1 hour (DCA recs don't change fast)
};

function getCacheKey(endpoint) {
  // Normalize endpoint for caching (remove query params for some endpoints)
  const base = endpoint.split('?')[0];
  return CACHE_PREFIX + base.replace(/\//g, '_');
}

function getTTL(endpoint) {
  // Check for exact match first
  if (DEFAULT_TTLS[endpoint]) return DEFAULT_TTLS[endpoint];
  // Check for prefix match
  const base = endpoint.split('?')[0];
  if (DEFAULT_TTLS[base]) return DEFAULT_TTLS[base];
  // Default: 5 minutes
  return 5 * 60 * 1000;
}

/**
 * Get cached data if it exists and is not too old.
 * @param {string} endpoint - API endpoint
 * @param {number} maxAgeMs - Optional max age override
 * @returns {{ value: any, ts: number, isStale: boolean } | null}
 */
export function getCache(endpoint, maxAgeMs = null) {
  try {
    const key = getCacheKey(endpoint);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const { value, ts } = JSON.parse(raw);
    const age = Date.now() - ts;
    const ttl = maxAgeMs || getTTL(endpoint);
    const isStale = age > ttl;

    return { value, ts, isStale };
  } catch {
    return null;
  }
}

/**
 * Set cache for an endpoint.
 * @param {string} endpoint - API endpoint
 * @param {any} value - Data to cache
 */
export function setCache(endpoint, value) {
  try {
    const key = getCacheKey(endpoint);
    localStorage.setItem(key, JSON.stringify({
      value,
      ts: Date.now(),
    }));
  } catch (e) {
    // localStorage might be full or disabled
    console.warn('[cache] Failed to set cache:', e.message);
  }
}

/**
 * Clear cache for an endpoint or all caches.
 * @param {string} endpoint - Optional endpoint to clear (clears all if omitted)
 */
export function clearCache(endpoint = null) {
  try {
    if (endpoint) {
      localStorage.removeItem(getCacheKey(endpoint));
    } else {
      // Clear all caches with our prefix
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {
    // Ignore
  }
}

/**
 * Get cache age in human-readable format.
 * @param {number} ts - Timestamp
 * @returns {string}
 */
export function formatCacheAge(ts) {
  if (!ts) return 'unknown';
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}
