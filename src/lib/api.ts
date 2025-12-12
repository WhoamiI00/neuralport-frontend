import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchProfile(userId: string) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
    headers: { 
      Authorization: `Bearer ${token}` 
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch profile')
  }

  return response.json()
}
