import { ref, onMounted, onUnmounted } from 'vue'
import { createLazyObserver } from '@/lib/performance'

/**
 * Composable for lazy loading images
 * Usage: const { imageRef, isLoaded, loadImage } = useLazyImage()
 */
export function useLazyImage(src: string, placeholder = '') {
  const imageRef = ref<HTMLImageElement | null>(null)
  const isLoaded = ref(false)
  const currentSrc = ref(placeholder)
  let observer: IntersectionObserver | null = null

  const loadImage = () => {
    if (!src || isLoaded.value) return
    
    const img = new Image()
    img.src = src
    img.onload = () => {
      currentSrc.value = src
      isLoaded.value = true
    }
  }

  onMounted(() => {
    if (!imageRef.value) return
    
    observer = createLazyObserver((entry) => {
      if (entry.isIntersecting) {
        loadImage()
        observer?.unobserve(entry.target)
      }
    })
    
    observer.observe(imageRef.value)
  })

  onUnmounted(() => {
    if (observer && imageRef.value) {
      observer.unobserve(imageRef.value)
    }
  })

  return {
    imageRef,
    isLoaded,
    currentSrc,
    loadImage
  }
}

/**
 * Composable for viewport visibility tracking
 * Useful for pausing animations/videos when off-screen
 */
export function useVisibility() {
  const elementRef = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!elementRef.value) return
    
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible.value = entry.isIntersecting
        })
      },
      { threshold: 0.1 }
    )
    
    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    if (observer && elementRef.value) {
      observer.unobserve(elementRef.value)
    }
  })

  return {
    elementRef,
    isVisible
  }
}

/**
 * Composable for debounced window resize handling
 * Prevents excessive re-renders during resize
 */
export function useResizeObserver(callback: (entry: ResizeObserverEntry) => void) {
  const elementRef = ref<HTMLElement | null>(null)
  let resizeObserver: ResizeObserver | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedCallback = (entries: ResizeObserverEntry[]) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      entries.forEach(callback)
    }, 100)
  }

  onMounted(() => {
    if (!elementRef.value) return
    
    resizeObserver = new ResizeObserver(debouncedCallback)
    resizeObserver.observe(elementRef.value)
  })

  onUnmounted(() => {
    if (resizeObserver && elementRef.value) {
      resizeObserver.unobserve(elementRef.value)
    }
    if (timeoutId) clearTimeout(timeoutId)
  })

  return { elementRef }
}
