import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface PoolAdmin {
  id: number
  email: string
  name: string | null
  is_active: boolean
  pool: {
    id: number
    name: string
  }
  assigned_tags: number[]
  tag_names: string[]
  devices: Array<{
    id: number
    name: string
    device_id: string
  }>
}

export interface PoolUser {
  id: number
  pin: string
  tenant_id: number
  device_name: string
  name: string | null
  uniform_number: number | null
  portrait_image: string | null
  created_at: string | null
  tags: Array<{
    id: number
    name: string
    color: string
  }>
}

export interface PoolTag {
  id: number
  name: string
  color: string
  category: string | null
  tenant_id: number
  device_name: string
  is_admin_tag: boolean
}

export interface PoolDevice {
  id: number
  name: string
  device_id: string
}

export const usePoolAdminStore = defineStore('poolAdmin', () => {
  // State
  const poolAdmin = ref<PoolAdmin | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(true)
  const users = ref<PoolUser[]>([])
  const tags = ref<PoolTag[]>([])
  const devices = ref<PoolDevice[]>([])
  const selectedUserId = ref<number | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!poolAdmin.value && !!token.value)
  const assignedTagIds = computed(() => poolAdmin.value?.assigned_tags || [])
  const poolName = computed(() => poolAdmin.value?.pool?.name || '')
  const selectedUser = computed(() => 
    users.value.find(u => u.id === selectedUserId.value) || null
  )

  // Initialize from localStorage
  function initialize() {
    const savedToken = localStorage.getItem('pool_admin_token')
    const savedPoolAdmin = localStorage.getItem('pool_admin_user')
    
    if (savedToken && savedPoolAdmin) {
      token.value = savedToken
      try {
        poolAdmin.value = JSON.parse(savedPoolAdmin)
        // Load devices from saved data
        if (poolAdmin.value?.devices) {
          devices.value = poolAdmin.value.devices
        }
      } catch {
        localStorage.removeItem('pool_admin_token')
        localStorage.removeItem('pool_admin_user')
      }
    }
    loading.value = false
  }

  // Login
  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }
      
      token.value = data.token
      poolAdmin.value = data.poolAdmin
      devices.value = data.poolAdmin.devices || []
      
      localStorage.setItem('pool_admin_token', data.token)
      localStorage.setItem('pool_admin_user', JSON.stringify(data.poolAdmin))
      
      return { success: true }
    } catch (error) {
      console.error('Pool admin login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Logout
  async function logout() {
    try {
      if (token.value) {
        await fetch(`${API_BASE_URL}/api/pool-admin/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token.value}` }
        })
      }
    } catch (e) {
      console.error('Logout error:', e)
    }
    
    // Clear all localStorage except theme/language
    const keysToKeep = ['zen-theme', 'zen-language']
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Reset state
    poolAdmin.value = null
    token.value = null
    users.value = []
    tags.value = []
    devices.value = []
    selectedUserId.value = null
  }

  // Get current pool admin info
  async function fetchMe(): Promise<boolean> {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/auth/me`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          await logout()
        }
        return false
      }
      
      const data = await response.json()
      poolAdmin.value = data.poolAdmin
      devices.value = data.poolAdmin.devices || []
      
      localStorage.setItem('pool_admin_user', JSON.stringify(data.poolAdmin))
      return true
    } catch (error) {
      console.error('Fetch me error:', error)
      return false
    }
  }

  // Fetch users filtered by admin's tags
  async function fetchUsers(): Promise<boolean> {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/users`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (!response.ok) {
        if (response.status === 401) await logout()
        return false
      }
      
      const data = await response.json()
      users.value = data.users || []
      return true
    } catch (error) {
      console.error('Fetch users error:', error)
      return false
    }
  }

  // Fetch single user
  async function fetchUser(userId: number): Promise<PoolUser | null> {
    if (!token.value) return null
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('Fetch user error:', error)
      return null
    }
  }

  // Create user
  async function createUser(payload: {
    tenant_id: number
    pin: string
    name?: string
    uniform_number?: number
    portrait_image?: string
    extra_tags?: number[]
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!token.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create user' }
      }
      
      // Refresh users list
      await fetchUsers()
      
      return { success: true, user: data }
    } catch (error) {
      console.error('Create user error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Update user
  async function updateUser(userId: number, payload: {
    name?: string
    uniform_number?: number
    portrait_image?: string
    add_tags?: number[]
    remove_tags?: number[]
  }): Promise<{ success: boolean; error?: string; tags_protected?: number[] }> {
    if (!token.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/users/${userId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update user' }
      }
      
      // Refresh users list
      await fetchUsers()
      
      return { 
        success: true, 
        tags_protected: data.tags_protected 
      }
    } catch (error) {
      console.error('Update user error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Fetch available tags
  async function fetchTags(): Promise<boolean> {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/tags`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (!response.ok) return false
      
      const data = await response.json()
      tags.value = data.tags || []
      return true
    } catch (error) {
      console.error('Fetch tags error:', error)
      return false
    }
  }

  // Fetch devices in pool
  async function fetchDevices(): Promise<boolean> {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/devices`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (!response.ok) return false
      
      const data = await response.json()
      devices.value = data.devices || []
      return true
    } catch (error) {
      console.error('Fetch devices error:', error)
      return false
    }
  }

  // Fetch user scores
  async function fetchUserScores(userId: number): Promise<any[]> {
    if (!token.value) return []
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/users/${userId}/scores`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.scores || []
    } catch (error) {
      console.error('Fetch scores error:', error)
      return []
    }
  }

  // Fetch user storage averages (blink/pupil data)
  async function fetchUserStorageAvg(userId: number): Promise<any[]> {
    if (!token.value) return []
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-admin/users/${userId}/storage-avg`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.averages || []
    } catch (error) {
      console.error('Fetch storage avg error:', error)
      return []
    }
  }

  // Select user
  function selectUser(userId: number | null) {
    selectedUserId.value = userId
  }

  return {
    // State
    poolAdmin,
    token,
    loading,
    users,
    tags,
    devices,
    selectedUserId,
    
    // Computed
    isAuthenticated,
    assignedTagIds,
    poolName,
    selectedUser,
    
    // Actions
    initialize,
    login,
    logout,
    fetchMe,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    fetchTags,
    fetchDevices,
    fetchUserScores,
    fetchUserStorageAvg,
    selectUser
  }
})
