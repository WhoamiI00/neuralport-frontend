/**
 * Cache Management Utility
 * 
 * Provides intelligent caching for dashboard data using localStorage
 * and cache validation based on profile updates and score counts
 */

import { API_BASE_URL } from './api'

interface CacheStatus {
  userId?: number
  tenantId?: number
  profileUpdatedAt: string | null
  scoreCount: number
  userCount?: number
  cacheKey: string
}

interface CachedData<T> {
  data: T
  cacheKey: string
  timestamp: number
}

/**
 * Get cache status for a specific user
 */
export async function getUserCacheStatus(userId: number, token: string): Promise<CacheStatus> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/cache-status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to get cache status')
  }
  
  return response.json()
}

/**
 * Get cache status for entire tenant (admin only)
 */
export async function getTenantCacheStatus(tenantId: number, token: string): Promise<CacheStatus> {
  const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/cache-status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to get cache status')
  }
  
  return response.json()
}

/**
 * Get cached data from localStorage if valid
 */
export function getCachedData<T>(cacheKey: string, currentCacheStatus: string): T | null {
  try {
    const cachedJson = localStorage.getItem(cacheKey)
    if (!cachedJson) {
      return null
    }
    
    const cached: CachedData<T> = JSON.parse(cachedJson)
    
    // Check if cache is still valid by comparing cache keys
    if (cached.cacheKey !== currentCacheStatus) {
      return null
    }
    
    // Optional: Add time-based expiration (e.g., 1 hour)
    const MAX_AGE = 60 * 60 * 1000 // 1 hour
    const age = Date.now() - cached.timestamp
    
    if (age > MAX_AGE) {
      return null
    }
    
    return cached.data
  } catch (e) {
    console.error('Cache error:', e)
    return null
  }
}

/**
 * Save data to localStorage cache
 */
export function setCachedData<T>(cacheKey: string, data: T, cacheStatus: string): void {
  try {
    const cached: CachedData<T> = {
      data,
      cacheKey: cacheStatus,
      timestamp: Date.now()
    }
    
    localStorage.setItem(cacheKey, JSON.stringify(cached))
  } catch (e) {
    // If quota exceeded, clear old caches
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      clearOldCaches()
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data, cacheKey: cacheStatus, timestamp: Date.now() }))
      } catch {
        console.warn('Failed to cache data')
      }
    }
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(cacheKey: string): void {
  localStorage.removeItem(cacheKey)
}

/**
 * Clear all dashboard caches
 */
export function clearAllDashboardCaches(): void {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('dashboard_') || key.startsWith('user_') || key.startsWith('tenant_')) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Clear old cache entries (keep only recent 10)
 */
function clearOldCaches(): void {
  const cacheEntries: Array<{ key: string; timestamp: number }> = []
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('dashboard_') || key.startsWith('user_') || key.startsWith('tenant_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        cacheEntries.push({ key, timestamp: data.timestamp || 0 })
      } catch {
        // Invalid cache entry, remove it
        localStorage.removeItem(key)
      }
    }
  })
  
  // Sort by timestamp and keep only newest 10
  cacheEntries.sort((a, b) => b.timestamp - a.timestamp)
  cacheEntries.slice(10).forEach(entry => {
    localStorage.removeItem(entry.key)
  })
}

/**
 * Cache wrapper for dashboard data fetching
 * 
 * Usage:
 * ```ts
 * const data = await fetchWithCache(
 *   'dashboard_scores_123',
 *   userId,
 *   token,
 *   async () => fetchScoresFromAPI()
 * )
 * ```
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  userId: number,
  token: string,
  fetchFn: () => Promise<T>,
  isAdmin = false
): Promise<T> {
  try {
    // Get current cache status
    const cacheStatus = isAdmin 
      ? await getTenantCacheStatus(userId, token)
      : await getUserCacheStatus(userId, token)
    
    // Check if we have valid cached data
    const cached = getCachedData<T>(cacheKey, cacheStatus.cacheKey)
    if (cached !== null) {
      return cached
    }
    
    // Fetch fresh data
    const data = await fetchFn()
    
    // Cache the fresh data
    setCachedData(cacheKey, data, cacheStatus.cacheKey)
    
    return data
  } catch (e) {
    // On error, try to return cached data even if stale
    const staleCache = localStorage.getItem(cacheKey)
    if (staleCache) {
      try {
        const parsed: CachedData<T> = JSON.parse(staleCache)
        return parsed.data
      } catch {
        // If parsing fails, fetch fresh
      }
    }
    // If no cache available, fetch fresh
    return fetchFn()
  }
}
