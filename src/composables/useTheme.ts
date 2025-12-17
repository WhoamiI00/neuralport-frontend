/**
 * useTheme Composable
 * 
 * Provides shared theme state across all components in the application.
 * Theme preference is persisted to localStorage and syncs with system preferences.
 */
import { ref, watch, readonly } from 'vue'

// Singleton theme state - shared across all components
const isDark = ref(false)
const isInitialized = ref(false)

/**
 * Initialize theme from localStorage or system preference
 * Only runs once on first use
 */
function initializeTheme() {
  if (isInitialized.value) return
  
  const savedTheme = localStorage.getItem('zen-theme')
  if (savedTheme !== null) {
    isDark.value = savedTheme === 'dark'
  } else {
    // Check system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  applyTheme()
  watchSystemPreference()
  isInitialized.value = true
}

/**
 * Apply theme classes to document
 */
function applyTheme() {
  const html = document.documentElement
  const body = document.body
  
  if (isDark.value) {
    html.classList.add('dark-mode')
    body.classList.add('dark-mode')
    html.setAttribute('data-theme', 'dark')
  } else {
    html.classList.remove('dark-mode')
    body.classList.remove('dark-mode')
    html.setAttribute('data-theme', 'light')
  }
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('zen-theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

/**
 * Set theme explicitly
 */
function setTheme(dark: boolean) {
  isDark.value = dark
  localStorage.setItem('zen-theme', dark ? 'dark' : 'light')
  applyTheme()
}

/**
 * Watch for system preference changes
 */
function watchSystemPreference() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't set a preference
    if (localStorage.getItem('zen-theme') === null) {
      isDark.value = e.matches
      applyTheme()
    }
  })
}

// Watch isDark changes to apply theme
watch(isDark, () => {
  applyTheme()
})

/**
 * Theme composable
 * 
 * Usage:
 * ```ts
 * import { useTheme } from '@/composables/useTheme'
 * 
 * const { isDark, toggleTheme } = useTheme()
 * ```
 */
export function useTheme() {
  // Initialize on first use
  initializeTheme()
  
  return {
    isDark: readonly(isDark),
    toggleTheme,
    setTheme
  }
}

export default useTheme
