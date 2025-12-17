const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function fetchProfile(userId: string | number) {
  const token = localStorage.getItem('auth_token')

  if (!token) {
    throw new Error('No authentication token found')
  }

  const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
    headers: { 
      Authorization: `Bearer ${token}` 
    },
    credentials: 'include'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch profile (${response.status})`)
  }

  return response.json()
}
