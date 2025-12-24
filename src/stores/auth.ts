import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface User {
  id: string
  pin: string
  device_id: string
  vr_name?: string
  tenant_id: string
  is_admin?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  function initialize() {
    // Load token and user from localStorage
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
    
    loading.value = false
  }

  async function signIn(deviceId: string, pin: string, adminPassword?: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: deviceId,
        username: pin,
        password: pin,
        ...(adminPassword && { adminPassword })
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    
    // Check if admin setup is needed
    if (data.needsAdminSetup) {
      return { needsAdminSetup: true, message: data.message }
    }
    
    token.value = data.token
    user.value = data.user
    
    // Persist to localStorage
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    
    return { needsAdminSetup: false }
  }

  async function signOut() {
    if (token.value) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
          },
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  async function fetchCurrentUser() {
    if (!token.value) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      // If token is invalid/expired, clear auth state
      if (response.status === 401) {
        console.warn('Token expired or invalid, logging out')
        await signOut()
      }
      throw new Error('Failed to fetch user')
    }

    const data = await response.json()
    user.value = data.user
    localStorage.setItem('auth_user', JSON.stringify(data.user))
  }

  async function validateToken() {
    // Check if token is still valid by calling /me
    try {
      await fetchCurrentUser()
      return true
    } catch (error) {
      return false
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    initialize,
    signIn,
    signOut,
    fetchCurrentUser,
    validateToken,
  }
})
