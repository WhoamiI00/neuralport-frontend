// Use Vite dev server proxy - all /api requests will be forwarded to Django backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Helper to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    throw new Error('No authentication token found')
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// ============================================================================
// PROFILE API
// ============================================================================

export async function fetchProfile(userId: string | number) {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${userId}/`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch profile (${response.status})`)
  }

  return response.json()
}

// ============================================================================
// STORAGE API
// ============================================================================

export interface StorageData {
  key: string
  data: Record<string, any>
  meta?: Record<string, any>
}

export interface StorageResponse {
  id: number
  key: string
  data: Record<string, any>
  meta?: Record<string, any>
  version?: number
  created_at: string
  updated_at?: string
}

export async function insertStorage(storageData: StorageData): Promise<StorageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/storage`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(storageData)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to insert storage (${response.status})`)
  }

  return response.json()
}

export async function getStorage(key: string): Promise<StorageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/storage/${encodeURIComponent(key)}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to get storage (${response.status})`)
  }

  return response.json()
}

// ============================================================================
// SCORES API
// ============================================================================

export interface Score {
  id: number
  key: string
  score: number
  created_at: string
}

export async function listScores(tenantId: number, userId: number): Promise<Score[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/tenants/${tenantId}/users/${userId}/scores`,
    {
      headers: getAuthHeaders(),
      credentials: 'include'
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to list scores (${response.status})`)
  }

  const data = await response.json()
  return data.scores || []
}

export async function getLatestScore(tenantId: number, userId: number): Promise<Score> {
  const response = await fetch(
    `${API_BASE_URL}/api/tenants/${tenantId}/users/${userId}/latest`,
    {
      headers: getAuthHeaders(),
      credentials: 'include'
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to get latest score (${response.status})`)
  }

  return response.json()
}

// ============================================================================
// USERS API
// ============================================================================

export interface UserProfile {
  id: number
  pin: string
  tenant_id: number
  device_id: string
  name?: string
  uniform_number?: string | number
  portrait_image?: string
}

export async function getUser(userId: number): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to get user (${response.status})`)
  }

  return response.json()
}

export async function getUsersByGroup(linkId: number): Promise<UserProfile[]> {
  const response = await fetch(`${API_BASE_URL}/api/group/${linkId}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to get users by group (${response.status})`)
  }

  const data = await response.json()
  return data.user || []  // Backend returns "user" key for compatibility
}

// ============================================================================
// ADMIN API
// ============================================================================

export interface CreateUserRequest {
  pin: string
  name?: string
  uniform_number?: number | string
  portrait_image?: string
}

export interface CreateUserResponse {
  id: number
  pin: string
  name?: string
  uniform_number?: number
}

export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(userData)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to create user (${response.status})`)
  }

  return response.json()
}

export interface RenameUserRequest {
  userId: number
  name: string
}

export async function renameUser(data: RenameUserRequest): Promise<{ success: boolean; name: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rename`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to rename user (${response.status})`)
  }

  return response.json()
}

export interface UpdateAvatarRequest {
  userId: number
  avatarUrl: string
}

export async function updateAvatar(data: UpdateAvatarRequest): Promise<{ success: boolean; avatarUrl: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/updateAvatar`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to update avatar (${response.status})`)
  }

  return response.json()
}

// Export convenience object with all API functions
export const api = {
  // Profile
  fetchProfile,
  // Storage
  insertStorage,
  getStorage,
  // Scores
  listScores,
  latestScore: getLatestScore,
  // Users
  getUser,
  getUsersByGroup,
  // Admin
  createUser,
  renameUser,
  updateAvatar
}
