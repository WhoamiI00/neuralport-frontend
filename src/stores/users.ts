import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  getUser, 
  createUser, 
  renameUser, 
  updateAvatar,
  type UserProfile,
  type CreateUserRequest
} from '../lib/api'

export const useUserStore = defineStore('users', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentProfile = ref<UserProfile | null>(null)

  async function loadUser(userId: number): Promise<UserProfile> {
    loading.value = true
    error.value = null
    
    try {
      const user = await getUser(userId)
      currentProfile.value = user
      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createNewUser(userData: CreateUserRequest) {
    loading.value = true
    error.value = null
    
    try {
      const user = await createUser(userData)
      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUserName(userId: number, name: string) {
    loading.value = true
    error.value = null
    
    try {
      const result = await renameUser({ userId, name })
      // Update current profile if it's the same user
      if (currentProfile.value?.id === userId) {
        currentProfile.value.name = result.name
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to rename user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUserAvatar(userId: number, avatarUrl: string) {
    loading.value = true
    error.value = null
    
    try {
      const result = await updateAvatar({ userId, avatarUrl })
      // Update current profile if it's the same user
      if (currentProfile.value?.id === userId) {
        currentProfile.value.portrait_image = result.avatarUrl
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update avatar'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    currentProfile,
    loadUser,
    createNewUser,
    updateUserName,
    updateUserAvatar
  }
})
