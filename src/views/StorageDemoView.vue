<template>
  <div class="storage-demo">
    <h2>Storage & Scores Demo</h2>

    <!-- Storage Section -->
    <section class="demo-section">
      <h3>Save Data</h3>
      <div class="form-group">
        <label for="key">Key:</label>
        <input v-model="storageKey" id="key" type="text" placeholder="unique-key" />
      </div>
      <div class="form-group">
        <label for="stress">Stress Level:</label>
        <input v-model.number="stressLevel" id="stress" type="number" min="0" max="100" />
      </div>
      <button @click="handleSaveStorage" :disabled="storageStore.loading">
        {{ storageStore.loading ? 'Saving...' : 'Save Storage' }}
      </button>
      <div v-if="storageStore.error" class="error">{{ storageStore.error }}</div>
      <div v-if="savedStorage" class="success">
        ✓ Saved! ID: {{ savedStorage.id }}, Created: {{ new Date(savedStorage.created_at).toLocaleString() }}
      </div>
    </section>

    <!-- Retrieve Storage Section -->
    <section class="demo-section">
      <h3>Load Data</h3>
      <div class="form-group">
        <label for="loadKey">Key to Load:</label>
        <input v-model="loadKey" id="loadKey" type="text" placeholder="unique-key" />
      </div>
      <button @click="handleLoadStorage" :disabled="storageStore.loading">
        {{ storageStore.loading ? 'Loading...' : 'Load Storage' }}
      </button>
      <div v-if="loadedStorage" class="data-display">
        <pre>{{ JSON.stringify(loadedStorage, null, 2) }}</pre>
      </div>
    </section>

    <!-- Scores Section -->
    <section class="demo-section" v-if="authStore.user">
      <h3>My Scores</h3>
      <button @click="handleLoadScores" :disabled="storageStore.loading">
        {{ storageStore.loading ? 'Loading...' : 'Load Scores' }}
      </button>
      <div v-if="scores.length > 0" class="scores-list">
        <div class="score-item" v-for="score in scores" :key="score.id">
          <span class="score-value">{{ score.score }}</span>
          <span class="score-date">{{ new Date(score.created_at).toLocaleString() }}</span>
        </div>
      </div>
      <div v-else-if="!storageStore.loading && scoresLoaded">
        No scores found
      </div>
    </section>

    <!-- Latest Score Section -->
    <section class="demo-section" v-if="authStore.user">
      <h3>Latest Score</h3>
      <button @click="handleLoadLatestScore" :disabled="storageStore.loading">
        {{ storageStore.loading ? 'Loading...' : 'Get Latest' }}
      </button>
      <div v-if="latestScore" class="latest-score">
        <h4>{{ latestScore.score }}</h4>
        <p>{{ new Date(latestScore.created_at).toLocaleString() }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useStorageStore } from '../stores/storage'
import type { StorageResponse, Score } from '../lib/api'

const authStore = useAuthStore()
const storageStore = useStorageStore()

// Storage form
const storageKey = ref('')
const stressLevel = ref(50)
const savedStorage = ref<StorageResponse | null>(null)

// Load storage
const loadKey = ref('')
const loadedStorage = ref<StorageResponse | null>(null)

// Scores
const scores = ref<Score[]>([])
const scoresLoaded = ref(false)
const latestScore = ref<Score | null>(null)

async function handleSaveStorage() {
  if (!storageKey.value) {
    alert('Please enter a key')
    return
  }

  try {
    savedStorage.value = await storageStore.saveStorage({
      key: storageKey.value,
      data: {
        docType: 'stress',
        stress: stressLevel.value,
        timestamp: new Date().toISOString()
      },
      meta: {
        source: 'vue-demo'
      }
    })
    
    // Clear form
    storageKey.value = ''
    stressLevel.value = 50
  } catch (error) {
    console.error('Save error:', error)
  }
}

async function handleLoadStorage() {
  if (!loadKey.value) {
    alert('Please enter a key to load')
    return
  }

  try {
    loadedStorage.value = await storageStore.loadStorage(loadKey.value)
  } catch (error) {
    console.error('Load error:', error)
    loadedStorage.value = null
  }
}

async function handleLoadScores() {
  if (!authStore.user?.tenant_id || !authStore.user?.id) return

  try {
    scores.value = await storageStore.getUserScores(
      parseInt(authStore.user.tenant_id),
      parseInt(authStore.user.id)
    )
    scoresLoaded.value = true
  } catch (error) {
    console.error('Load scores error:', error)
  }
}

async function handleLoadLatestScore() {
  if (!authStore.user?.tenant_id || !authStore.user?.id) return

  try {
    latestScore.value = await storageStore.getUserLatestScore(
      parseInt(authStore.user.tenant_id),
      parseInt(authStore.user.id)
    )
  } catch (error) {
    console.error('Load latest score error:', error)
    latestScore.value = null
  }
}
</script>

<style scoped>
.storage-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.demo-section {
  background: #f5f5f5;
  padding: 1.5rem;
  margin: 1rem 0;
  border-radius: 8px;
}

.demo-section h3 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin: 1rem 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover:not(:disabled) {
  background: #45a049;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #f44336;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #ffebee;
  border-radius: 4px;
}

.success {
  color: #4CAF50;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #e8f5e9;
  border-radius: 4px;
}

.data-display {
  margin-top: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.data-display pre {
  margin: 0;
  font-size: 0.9rem;
}

.scores-list {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.score-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  margin: 0.5rem 0;
  border-radius: 4px;
}

.score-value {
  font-weight: bold;
  font-size: 1.2rem;
  color: #4CAF50;
}

.score-date {
  color: #666;
  font-size: 0.9rem;
}

.latest-score {
  margin-top: 1rem;
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 4px;
}

.latest-score h4 {
  font-size: 3rem;
  margin: 0;
  color: #4CAF50;
}

.latest-score p {
  color: #666;
  margin: 0.5rem 0 0 0;
}
</style>
