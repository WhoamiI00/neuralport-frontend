import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  insertStorage, 
  getStorage, 
  listScores, 
  getLatestScore,
  type StorageData,
  type StorageResponse,
  type Score
} from '../lib/api'

export const useStorageStore = defineStore('storage', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function saveStorage(data: StorageData): Promise<StorageResponse> {
    loading.value = true
    error.value = null
    
    try {
      const result = await insertStorage(data)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save storage'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadStorage(key: string): Promise<StorageResponse> {
    loading.value = true
    error.value = null
    
    try {
      const result = await getStorage(key)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load storage'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getUserScores(tenantId: number, userId: number): Promise<Score[]> {
    loading.value = true
    error.value = null
    
    try {
      const scores = await listScores(tenantId, userId)
      return scores
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load scores'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getUserLatestScore(tenantId: number, userId: number): Promise<Score> {
    loading.value = true
    error.value = null
    
    try {
      const score = await getLatestScore(tenantId, userId)
      return score
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load latest score'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    saveStorage,
    loadStorage,
    getUserScores,
    getUserLatestScore
  }
})
