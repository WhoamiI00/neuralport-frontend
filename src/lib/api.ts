// Use Vite dev server proxy - all /api requests will be forwarded to Django backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// ============================================================================
// REQUEST DEDUPLICATION
// Prevents duplicate concurrent requests to the same endpoint
// ============================================================================
const pendingRequests = new Map<string, Promise<any>>()

function deduplicatedFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  // If there's already a pending request for this key, return it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>
  }
  
  // Create new request and store it
  const request = fetchFn().finally(() => {
    // Remove from pending after completion (success or error)
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, request)
  return request
}

// Helper to get auth headers - supports both regular auth and superadmin auth
function getAuthHeaders() {
  // Check for regular auth token first
  let token = localStorage.getItem('auth_token')
  
  // Fall back to superadmin token if no regular token
  if (!token) {
    token = localStorage.getItem('superadmin_token')
  }
  
  if (!token) {
    throw new Error('No authentication token found')
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Helper to handle API responses with 401 auto-logout
async function handleApiResponse(response: Response) {
  if (response.status === 401) {
    // Token expired - clear auth and redirect to login
    console.warn('Token expired, clearing auth state')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    
    // Redirect to login (if not already there)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?expired=true'
    }
    
    throw new Error('Session expired. Please login again.')
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API error (${response.status})`)
  }
  
  return response.json()
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Tag {
  id: number
  name: string
  category?: string
  color: string
  description?: string
  created_at?: string
}

// ============================================================================
// PROFILE API
// ============================================================================

export async function fetchProfile(userId: string | number) {
  const response = await fetch(`${API_BASE_URL}/api/profiles/${userId}/`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
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

  return handleApiResponse(response)
}

export async function getStorage(key: string): Promise<StorageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/storage/${encodeURIComponent(key)}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// ============================================================================
// STORAGE AVG API
// ============================================================================

export interface StorageAvgResponse {
  id: number
  key: string
  leftBlinkDuration?: number
  rightBlinkDuration?: number
  leftMA?: number
  rightMA?: number
  leftPupilSize?: number
  rightPupilSize?: number
  created_at: string
}

export async function getStorageAvg(key: string): Promise<StorageAvgResponse> {
  const response = await fetch(`${API_BASE_URL}/api/storage-avg/${encodeURIComponent(key)}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

export async function listStorageAvg(tenantId: number, userId: number): Promise<StorageAvgResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/tenants/${tenantId}/users/${userId}/storage-avg`,
    {
      headers: getAuthHeaders(),
      credentials: 'include'
    }
  )

  const data = await handleApiResponse(response)
  return data.averages || []
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
  const cacheKey = `listScores_${tenantId}_${userId}`
  
  return deduplicatedFetch(cacheKey, async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/tenants/${tenantId}/users/${userId}/scores`,
      {
        headers: getAuthHeaders(),
        credentials: 'include'
      }
    )

    const data = await handleApiResponse(response)
    return data.scores || []
  })
}

export async function listTenantScores(tenantId: number): Promise<Score[]> {
  const cacheKey = `listTenantScores_${tenantId}`
  
  return deduplicatedFetch(cacheKey, async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/tenants/${tenantId}/scores`,
      {
        headers: getAuthHeaders(),
        credentials: 'include'
      }
    )

    const data = await handleApiResponse(response)
    return data.scores || []
  })
}

export async function getLatestScore(tenantId: number, userId: number): Promise<Score> {
  const cacheKey = `getLatestScore_${tenantId}_${userId}`
  
  return deduplicatedFetch(cacheKey, async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/tenants/${tenantId}/users/${userId}/latest`,
      {
        headers: getAuthHeaders(),
        credentials: 'include'
      }
    )

    return handleApiResponse(response)
  })
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
  tags?: Tag[]
}

export async function getUser(userId: number): Promise<UserProfile> {
  const cacheKey = `getUser_${userId}`
  
  return deduplicatedFetch(cacheKey, async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    })

    return handleApiResponse(response)
  })
}

export async function getUsersByGroup(linkId: number): Promise<UserProfile[]> {
  const response = await fetch(`${API_BASE_URL}/api/group/${linkId}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  const data = await handleApiResponse(response)
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
  tenant_id?: number  // Required for superadmin, optional for regular admin
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

  return handleApiResponse(response)
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

  return handleApiResponse(response)
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

  return handleApiResponse(response)
}

// ============================================================================
// TAGS API
// ============================================================================

export interface CreateTagRequest {
  name: string
  category?: string
  color?: string
  description?: string
  user_id?: number  // Required for superadmins to specify which tenant
}

export async function listTags(): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/tags`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  const data = await handleApiResponse(response)
  return data.tags || []
}

export async function createTag(tagData: CreateTagRequest): Promise<Tag> {
  const response = await fetch(`${API_BASE_URL}/api/admin/tags`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(tagData)
  })

  return handleApiResponse(response)
}

export async function deleteTag(tagId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/tags/${tagId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  await handleApiResponse(response)
}

export async function getTagSuggestions(query: string = '', userId?: number): Promise<Tag[]> {
  let url = `${API_BASE_URL}/api/admin/tags/suggestions`
  const params = new URLSearchParams()
  
  if (query) {
    params.append('q', query)
  }
  if (userId) {
    params.append('user_id', userId.toString())
  }
  
  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  const data = await handleApiResponse(response)
  return data.suggestions || []
}

export async function assignTagsToUser(userId: number, tagIds: number[]): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/tags`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ tag_ids: tagIds })
  })

  const data = await handleApiResponse(response)
  return data.tags || []
}

export async function removeTagFromUser(userId: number, tagId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/tags/${tagId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  await handleApiResponse(response)
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
  listTenantScores,
  latestScore: getLatestScore,
  // Users
  getUser,
  getUsersByGroup,
  // Admin
  createUser,
  renameUser,
  updateAvatar,
  // Tags
  listTags,
  createTag,
  deleteTag,
  getTagSuggestions,
  assignTagsToUser,
  removeTagFromUser
}
