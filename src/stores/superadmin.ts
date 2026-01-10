import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface Superadmin {
  id: number
  email: string
  name: string | null
  is_active: boolean
  created_at: string
  managed_devices_count?: number
}

export interface ManagedDevice {
  id: number
  device_id: string
  name: string
  user_count: number
  has_admin: boolean
  permissions: {
    read: boolean
    write: boolean
    manage_users: boolean
  }
  added_at: string
  created_at?: string
}

export interface DeviceUser {
  id: number
  pin: string
  created_at: string
  name: string | null
  uniform_number: string | null
  portrait_image: string | null
  score_count: number
  device_id?: string
  device_name?: string
  tenant_id?: number
  tags?: Array<{
    id: number
    name: string
    category?: string
    color: string
    description?: string
  }>
  performance_type?: {
    key: string
    name: string
    description: string
  } | null
}

export interface DashboardStats {
  total_devices: number
  total_users: number
  total_sessions: number
  avg_score: number | null
  devices: Array<{
    id: number
    device_id: string
    name: string
    user_count: number
    session_count: number
    avg_score: number | null
  }>
}

export const useSuperadminStore = defineStore('superadmin', () => {
  // State
  const superadmin = ref<Superadmin | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(true)
  const managedDevices = ref<ManagedDevice[]>([])
  const selectedDeviceId = ref<number | null>(null)
  const dashboardStats = ref<DashboardStats | null>(null)
  const deviceUsers = ref<Record<number | string, DeviceUser[]>>({})

  // Computed
  const isAuthenticated = computed(() => !!superadmin.value && !!token.value)
  const selectedDevice = computed(() => 
    managedDevices.value.find(d => d.id === selectedDeviceId.value) || null
  )
  // Alias for backward compatibility
  const devices = computed(() => managedDevices.value)

  // Initialize from localStorage
  function initialize() {
    const savedToken = localStorage.getItem('superadmin_token')
    const savedSuperadmin = localStorage.getItem('superadmin_user')
    const savedDeviceId = localStorage.getItem('superadmin_selected_device')
    
    if (savedToken && savedSuperadmin) {
      token.value = savedToken
      try {
        superadmin.value = JSON.parse(savedSuperadmin)
      } catch {
        localStorage.removeItem('superadmin_token')
        localStorage.removeItem('superadmin_user')
      }
    }
    
    // Restore selected device
    if (savedDeviceId) {
      selectedDeviceId.value = parseInt(savedDeviceId, 10)
    }
    
    loading.value = false
  }

  // Register new superadmin
  async function register(email: string, password: string, name?: string) {
    const response = await fetch(`${API_BASE_URL}/api/superadmin/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const data = await response.json()
    
    token.value = data.token
    superadmin.value = data.superadmin
    
    localStorage.setItem('superadmin_token', data.token)
    localStorage.setItem('superadmin_user', JSON.stringify(data.superadmin))
    
    return data
  }

  // Login
  async function login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/superadmin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    
    console.log('Superadmin login response:', data)
    
    token.value = data.token
    superadmin.value = data.superadmin
    
    localStorage.setItem('superadmin_token', data.token)
    localStorage.setItem('superadmin_user', JSON.stringify(data.superadmin))
    
    console.log('Token stored:', token.value)
    console.log('isAuthenticated:', isAuthenticated.value)
    
    return data
  }

  // Logout
  async function logout() {
    if (token.value) {
      try {
        await fetch(`${API_BASE_URL}/api/superadmin/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token.value}` }
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    token.value = null
    superadmin.value = null
    managedDevices.value = []
    selectedDeviceId.value = null
    dashboardStats.value = null
    
    // Clear all localStorage except theme and language preferences
    const preserveKeys = ['zen-theme', 'zen-language']
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !preserveKeys.includes(key)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  // Fetch current superadmin info
  async function fetchMe() {
    if (!token.value) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/auth/me`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (!response.ok) {
      if (response.status === 401) {
        await logout()
      }
      throw new Error('Failed to fetch superadmin info')
    }

    const data = await response.json()
    superadmin.value = data.superadmin
    managedDevices.value = data.managed_devices || []
    
    return data
  }

  // Fetch all managed devices
  async function fetchDevices() {
    if (!token.value) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/devices`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch devices')
    }

    const data = await response.json()
    managedDevices.value = data.devices || []
    
    return data
  }

  // Add a new device
  async function addDevice(deviceId: string) {
    if (!token.value) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ device_id: deviceId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add device')
    }

    const data = await response.json()
    
    // Refresh device list
    await fetchDevices()
    
    return data
  }

  // Remove a device from management
  async function removeDevice(deviceId: number | string) {
    if (!token.value) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/devices/${deviceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove device')
    }

    // Refresh device list
    await fetchDevices()
    
    // Clear selection if removed device was selected
    if (selectedDeviceId.value === deviceId) {
      selectedDeviceId.value = null
    }

    return await response.json()
  }

  // Fetch users for a specific device
  async function fetchDeviceUsers(deviceId: number | string): Promise<DeviceUser[]> {
    if (!token.value) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/devices/${deviceId}/users`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch device users')
    }

    const data = await response.json()
    const users = data.users || []
    
    // Store users in state for this device
    deviceUsers.value[deviceId] = users
    
    return users
  }

  // Create user on a specific device
  async function createDeviceUser(deviceId: number | string, userData: {
    pin: string
    name?: string
    uniform_number?: number
    portrait_image?: string
  }) {
    if (!token.value) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/devices/${deviceId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }

    return await response.json()
  }

  // Fetch dashboard stats
  async function fetchDashboard() {
    if (!token.value) {
      console.error('fetchDashboard: No token available')
      throw new Error('Not authenticated')
    }

    console.log('fetchDashboard: Using token:', token.value?.substring(0, 20) + '...')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/dashboard`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard')
    }

    const data = await response.json()
    dashboardStats.value = data
    
    return data
  }

  // Fetch all users across all devices
  async function fetchAllUsers(): Promise<DeviceUser[]> {
    if (!token.value) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/superadmin/users`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    const data = await response.json()
    return data.users || []
  }

  // Fetch all scores across all devices
  async function fetchAllScores(options?: { limit?: number; offset?: number; device_id?: string }) {
    if (!token.value) throw new Error('Not authenticated')

    const params = new URLSearchParams()
    if (options?.limit) params.set('limit', String(options.limit))
    if (options?.offset) params.set('offset', String(options.offset))
    if (options?.device_id) params.set('device_id', options.device_id)

    const url = `${API_BASE_URL}/api/superadmin/scores${params.toString() ? '?' + params.toString() : ''}`
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch scores')
    }

    return await response.json()
  }

  // Validate token
  async function validateToken() {
    try {
      await fetchMe()
      return true
    } catch {
      return false
    }
  }

  // Select a device
  function selectDevice(deviceId: number | null) {
    selectedDeviceId.value = deviceId
    
    // Persist to localStorage
    if (deviceId !== null) {
      localStorage.setItem('superadmin_selected_device', String(deviceId))
    } else {
      localStorage.removeItem('superadmin_selected_device')
    }
  }

  return {
    // State
    superadmin,
    token,
    loading,
    managedDevices,
    selectedDeviceId,
    dashboardStats,
    deviceUsers,
    
    // Computed
    isAuthenticated,
    selectedDevice,
    devices,
    
    // Actions
    initialize,
    register,
    login,
    logout,
    fetchMe,
    fetchDevices,
    addDevice,
    removeDevice,
    fetchDeviceUsers,
    createDeviceUser,
    fetchDashboard,
    fetchAllUsers,
    fetchAllScores,
    validateToken,
    selectDevice
  }
})
