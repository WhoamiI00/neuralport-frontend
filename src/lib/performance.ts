/**
 * Performance Utilities
 * Common optimization patterns used by high-performance websites
 */

// ============================================================================
// DEBOUNCE - Delays execution until input stops for specified time
// Use for: search inputs, resize handlers, form validation
// ============================================================================
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

// ============================================================================
// THROTTLE - Limits execution to once per specified time period
// Use for: scroll handlers, mousemove, continuous events
// ============================================================================
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastArgs: Parameters<T> | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
        if (lastArgs) {
          fn.apply(this, lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      lastArgs = args
    }
  }
}

// ============================================================================
// MEMOIZE - Caches function results based on arguments
// Use for: expensive computations, repeated calculations
// ============================================================================
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxSize?: number; ttl?: number } = {}
): T {
  const { maxSize = 100, ttl = 5 * 60 * 1000 } = options // 5 min default TTL
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>()
  
  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    // Return cached value if valid
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value
    }
    
    // Compute new value
    const result = fn.apply(this, args)
    
    // Evict oldest entries if cache is full
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
    
    cache.set(key, { value: result, timestamp: Date.now() })
    return result
  } as T
}

// ============================================================================
// REQUEST IDLE CALLBACK - Defers non-critical work
// Use for: analytics, prefetching, background tasks
// ============================================================================
export function runWhenIdle(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 100)
  }
}

// ============================================================================
// INTERSECTION OBSERVER HELPER - Lazy loading components/images
// Use for: lazy loading images, infinite scroll, visibility tracking
// ============================================================================
export function createLazyObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '100px', // Start loading 100px before element enters viewport
    threshold: 0.1,
    ...options
  }
  
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, defaultOptions)
}

// ============================================================================
// BATCH DOM UPDATES - Prevents layout thrashing
// Use for: multiple DOM reads/writes, animations
// ============================================================================
const readQueue: (() => void)[] = []
const writeQueue: (() => void)[] = []
let scheduled = false

function flush() {
  // Process reads first (to batch DOM reads)
  const reads = readQueue.splice(0, readQueue.length)
  reads.forEach(fn => fn())
  
  // Then process writes (to batch DOM writes)
  const writes = writeQueue.splice(0, writeQueue.length)
  writes.forEach(fn => fn())
  
  scheduled = false
}

export function batchRead(fn: () => void): void {
  readQueue.push(fn)
  if (!scheduled) {
    scheduled = true
    requestAnimationFrame(flush)
  }
}

export function batchWrite(fn: () => void): void {
  writeQueue.push(fn)
  if (!scheduled) {
    scheduled = true
    requestAnimationFrame(flush)
  }
}

// ============================================================================
// PREFETCH - Preload resources in background
// Use for: next page data, hover-triggered loading
// ============================================================================
const prefetchedUrls = new Set<string>()

export function prefetchUrl(url: string): void {
  if (prefetchedUrls.has(url)) return
  
  runWhenIdle(() => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
    prefetchedUrls.add(url)
  })
}

export function prefetchComponent(importFn: () => Promise<any>): void {
  runWhenIdle(() => {
    importFn().catch(() => {
      // Silently fail - this is just a performance optimization
    })
  })
}

// ============================================================================
// VIRTUAL SCROLL HELPERS - For large lists
// Use for: rendering large datasets efficiently
// ============================================================================
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3
): { start: number; end: number } {
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight)
  
  return {
    start: Math.max(0, visibleStart - overscan),
    end: Math.min(totalItems, visibleEnd + overscan)
  }
}

// ============================================================================
// CHUNK ARRAY - Process large arrays in batches
// Use for: processing large datasets without blocking UI
// ============================================================================
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize = 50,
  delay = 0
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    results.push(...chunk.map(processor))
    
    // Yield to main thread between chunks
    if (delay > 0 && i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return results
}

// ============================================================================
// IMAGE LOADING - Optimized image loading with placeholder
// ============================================================================
export function loadImageProgressively(
  imgElement: HTMLImageElement,
  lowResSrc: string,
  highResSrc: string
): void {
  // Load low-res first
  imgElement.src = lowResSrc
  imgElement.style.filter = 'blur(10px)'
  imgElement.style.transition = 'filter 0.3s ease'
  
  // Then load high-res
  const highResImage = new Image()
  highResImage.src = highResSrc
  highResImage.onload = () => {
    imgElement.src = highResSrc
    imgElement.style.filter = 'none'
  }
}
