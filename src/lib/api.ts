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

// Helper to get auth headers - supports regular auth, superadmin auth, and pool admin auth
function getAuthHeaders() {
  // Check for regular auth token first
  let token = localStorage.getItem('auth_token')
  
  // Fall back to superadmin token if no regular token
  if (!token) {
    token = localStorage.getItem('superadmin_token')
  }
  
  // Fall back to pool admin token
  if (!token) {
    token = localStorage.getItem('pool_admin_token')
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
  status?: string | null
}

export interface PerformanceType {
  key: string
  name: string
  description: string
}

export interface UserPerformanceTypeResponse {
  performance_type: PerformanceType | null
  assessed_at: string | null
  message?: string
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

export async function getUserPerformanceType(userId: number): Promise<UserPerformanceTypeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/assessments/user/${userId}/performance-type/`,
    {
      headers: getAuthHeaders(),
      credentials: 'include'
    }
  )

  return handleApiResponse(response)
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
  username: string  // This is actually the PIN (backend aliases pin as username for compatibility)
  pin?: string  // User's PIN code
  tenant_id: number
  device_id?: string
  serializedProfile?: string  // JSON string containing name, portrait_image, etc.
  name?: string
  uniform_number?: string | number
  portrait_image?: string
  tags?: Tag[]
  performance_type?: PerformanceType | null
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

// ============================================================================
// VR POOL / TEAM UNIT API (Superadmin only)
// ============================================================================

export interface VRPool {
  id: number
  name: string
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
  device_count: number
  user_count: number
}

export interface PoolDevice {
  id: number
  device_id: string
  name: string
  user_count?: number
  is_current?: boolean
  created_at?: string
}

export interface PoolUser {
  id: number
  pin: string
  name: string
  portrait_image?: string | null
  uniform_number?: number | null
  home_device: string
  home_tenant_id: number
  home_device_id?: string
  score_count?: number
}

export interface PinConflict {
  pin: string
  users: {
    user_id: number
    user_name: string
    device_name: string
    device_id?: string
    tenant_id: number
    portrait_image?: string | null
  }[]
  user_count?: number
}

export interface PoolDetailResponse {
  pool: VRPool
  devices: PoolDevice[]
  users: PoolUser[]
  conflicts: PinConflict[]
  has_conflicts: boolean
}

// List all pools owned by superadmin
export async function listPools(): Promise<VRPool[]> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  const data = await handleApiResponse(response)
  return data.pools || []
}

// Create a new pool
export async function createPool(name: string, description?: string): Promise<VRPool> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ name, description })
  })

  const data = await handleApiResponse(response)
  return data.pool
}

// Get pool details with devices and users
export async function getPoolDetail(poolId: number): Promise<PoolDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// Update pool
export async function updatePool(poolId: number, data: { name: string; description?: string; is_active?: boolean }): Promise<VRPool> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  })

  const result = await handleApiResponse(response)
  return result.pool
}

// Delete pool
export async function deletePool(poolId: number): Promise<{ message: string; devices_removed: number }> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// Add device to pool
export async function addDeviceToPool(poolId: number, deviceId: string | number): Promise<{
  device: PoolDevice
  conflicts?: PinConflict[]
  has_conflicts?: boolean
  warning?: string
}> {
  const body = typeof deviceId === 'number' 
    ? { tenant_id: deviceId }
    : { device_id: deviceId }
    
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/devices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(body)
  })

  return handleApiResponse(response)
}

// Remove device from pool
export async function removeDeviceFromPool(poolId: number, deviceId: string | number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/devices/${deviceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// Get PIN conflicts in pool
export async function getPoolConflicts(poolId: number): Promise<{
  pool: { id: number; name: string }
  conflicts: PinConflict[]
  total_conflicts: number
  has_conflicts: boolean
}> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/conflicts`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// Get pool users
export async function getPoolUsers(poolId: number, deviceFilter?: string): Promise<{
  pool: { id: number; name: string }
  users: PoolUser[]
  total: number
  filter_device?: string
}> {
  let url = `${API_BASE_URL}/api/superadmin/pools/${poolId}/users`
  if (deviceFilter) {
    url += `?device_id=${encodeURIComponent(deviceFilter)}`
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// Get pool scores
export async function getPoolScores(
  poolId: number, 
  options?: { device_id?: string; pin?: string; limit?: number; offset?: number }
): Promise<{
  pool: { id: number; name: string }
  scores: Score[]
  total: number
  filters: { device_id?: string; pin?: string }
}> {
  let url = `${API_BASE_URL}/api/superadmin/pools/${poolId}/scores`
  const params = new URLSearchParams()
  
  if (options?.device_id) params.append('device_id', options.device_id)
  if (options?.pin) params.append('pin', options.pin)
  if (options?.limit) params.append('limit', options.limit.toString())
  if (options?.offset) params.append('offset', options.offset.toString())
  
  const queryString = params.toString()
  if (queryString) url += `?${queryString}`
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// ============================================================================
// POOL ADMIN MANAGEMENT API (Superadmin only)
// ============================================================================

export interface PoolAdmin {
  id: number
  pool_id: number
  email: string
  name: string | null
  assigned_tags: string[]
  tag_names?: string[]
  is_active: boolean
  created_at: string
  updated_at: string | null
}

// List pool admins for a pool
export async function listPoolAdmins(poolId: number): Promise<PoolAdmin[]> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/admins`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  const data = await handleApiResponse(response)
  return data.admins || []
}

// Create pool admin
export async function createPoolAdmin(
  poolId: number, 
  data: { email: string; password: string; name?: string; assigned_tags?: string[] }
): Promise<PoolAdmin> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/admins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  })

  const result = await handleApiResponse(response)
  return result.admin
}

// Update pool admin
export async function updatePoolAdmin(
  poolId: number, 
  adminId: number, 
  data: { email?: string; password?: string; name?: string; assigned_tags?: string[]; is_active?: boolean }
): Promise<PoolAdmin> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/admins/${adminId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  })

  const result = await handleApiResponse(response)
  return result.admin
}

// Delete pool admin
export async function deletePoolAdmin(poolId: number, adminId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/admins/${adminId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  return handleApiResponse(response)
}

// Get available tags for pool (all tags owned by superadmin)
export async function getPoolTags(poolId: number): Promise<{ id: string; name: string }[]> {
  const response = await fetch(`${API_BASE_URL}/api/superadmin/pools/${poolId}/tags`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  })

  const data = await handleApiResponse(response)
  return data.tags || []
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
  removeTagFromUser,
  // Pools / Team Units
  listPools,
  createPool,
  getPoolDetail,
  updatePool,
  deletePool,
  addDeviceToPool,
  removeDeviceFromPool,
  getPoolConflicts,
  getPoolUsers,
  getPoolScores,
  // Pool Admins
  listPoolAdmins,
  createPoolAdmin,
  updatePoolAdmin,
  deletePoolAdmin,
  getPoolTags
}
