// Simple in-memory cache for API responses
type CacheEntry = {
  data: any
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

export function getCachedData(key: string) {
  const entry = cache[key]
  if (!entry) return null

  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    delete cache[key]
    return null
  }

  return entry.data
}

export function setCachedData(key: string, data: any) {
  cache[key] = {
    data,
    timestamp: Date.now(),
  }
}

// Generate a cache key from an image and optional parameters
export function generateCacheKey(imageData: string, params?: any) {
  // Use a hash of the image data (first 100 chars) plus any params
  const imageHash = imageData.substring(0, 100)
  const paramsString = params ? JSON.stringify(params) : ""
  return `${imageHash}_${paramsString}`
}
