<template>
  <div class="result-view" :class="{ 'dark-mode': isDark }">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading your results...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadResult" class="retry-btn">Try Again</button>
    </div>

    <!-- Result Content -->
    <div v-else-if="result" class="result-content">
      <!-- Header -->
      <div class="result-header">
        <div class="confetti">🎉</div>
        <h1>Your Performance Type</h1>
      </div>

      <!-- Type Card -->
      <div class="type-card">
        <div class="type-icon">{{ getTypeIcon(result.performance_type.key) }}</div>
        <h2 class="type-name">{{ result.performance_type.name }}</h2>
        <p class="type-description">{{ result.performance_type.description }}</p>
      </div>

      <!-- Axis Results -->
      <div class="axis-section">
        <h3>Your Axis Profile</h3>
        <div class="axis-grid">
          <div 
            v-for="(axis, key) in result.axis_results" 
            :key="key"
            class="axis-item"
          >
            <div class="axis-name">{{ axis.name }}</div>
            <div class="axis-bar">
              <div class="bar-track">
                <div 
                  class="bar-marker" 
                  :class="axis.position.toLowerCase()"
                  :style="{ left: getMarkerPosition(axis.position) }"
                ></div>
              </div>
              <div class="bar-labels">
                <span>A</span>
                <span>Middle</span>
                <span>B</span>
              </div>
            </div>
            <div class="axis-position">{{ formatPosition(axis.position) }}</div>
          </div>
        </div>
      </div>

      <!-- Strengths -->
      <div class="detail-section strengths">
        <h3>💪 Your Strengths</h3>
        <ul>
          <li v-for="(strength, index) in result.performance_type.strengths" :key="index">
            {{ strength }}
          </li>
        </ul>
      </div>

      <!-- Watch-outs -->
      <div class="detail-section watch-outs">
        <h3>⚡ Watch-outs</h3>
        <ul>
          <li v-for="(item, index) in result.performance_type.watch_outs" :key="index">
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- Approach -->
      <div class="detail-section approach">
        <h3>🎯 Recommended Approach</h3>
        <p>{{ result.performance_type.approach }}</p>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button @click="retakeAssessment" class="action-btn secondary">
          Retake Assessment
        </button>
        <button @click="goToDashboard" class="action-btn primary">
          Back to Dashboard
        </button>
      </div>

      <!-- Timestamp -->
      <p class="timestamp">
        Completed on {{ formatDate(result.created_at) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssessmentStore } from '../stores/assessment'
import { useTheme } from '../composables/useTheme'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const store = useAssessmentStore()
const { isDark } = useTheme()

const { loading, error, result } = storeToRefs(store)

const typeIcons: Record<string, string> = {
  boost: '🚀',
  deep_focus: '🎯',
  momentum: '🌊',
  stable: '⚓',
  trigger: '⚡',
  phase_in: '📈',
  recovery_first: '🔋',
  adaptive: '🔄',
}

function getTypeIcon(typeKey: string): string {
  return typeIcons[typeKey] || '✨'
}

function getMarkerPosition(position: string): string {
  switch (position) {
    case 'A': return '10%'
    case 'MIDDLE': return '50%'
    case 'B': return '90%'
    default: return '50%'
  }
}

function formatPosition(position: string): string {
  switch (position) {
    case 'A': return 'A-side'
    case 'MIDDLE': return 'Middle'
    case 'B': return 'B-side'
    default: return position
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadResult() {
  const id = Number(route.params.id)
  if (id) {
    await store.fetchResultDetail(id)
  }
}

function retakeAssessment() {
  store.reset()
  router.push({ name: 'assessment' })
}

function goToDashboard() {
  router.push({ name: 'dashboard' })
}

onMounted(() => {
  // If we came from submitting, result is already in store
  // Otherwise fetch it by ID
  if (!result.value || result.value.id !== Number(route.params.id)) {
    loadResult()
  }
})
</script>

<style scoped lang="scss">
.result-view {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  
  &.dark-mode {
    background: linear-gradient(135deg, #0a0a12 0%, #0f1419 100%);
  }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #fff;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #00d9ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #00d9ff;
  color: #1a1a2e;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    background: #00b8d9;
  }
}

.result-content {
  max-width: 800px;
  margin: 0 auto;
}

.result-header {
  text-align: center;
  margin-bottom: 2rem;
  
  .confetti {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: bounce 1s ease infinite;
  }
  
  h1 {
    color: #fff;
    font-size: 2rem;
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.type-card {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 255, 136, 0.2));
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  margin-bottom: 2rem;
  border: 1px solid rgba(0, 217, 255, 0.3);
  
  .type-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .type-name {
    color: #00d9ff;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  .type-description {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.2rem;
    font-style: italic;
  }
}

.axis-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    color: #fff;
    margin-bottom: 1.5rem;
    text-align: center;
  }
}

.axis-grid {
  display: grid;
  gap: 1.5rem;
}

.axis-item {
  .axis-name {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .axis-bar {
    .bar-track {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      position: relative;
    }
    
    .bar-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #00d9ff;
      border: 3px solid #fff;
      transition: left 0.3s ease;
      
      &.a { background: #ff6b6b; }
      &.middle { background: #ffd93d; }
      &.b { background: #4ecdc4; }
    }
    
    .bar-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      
      span {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
  
  .axis-position {
    text-align: center;
    margin-top: 0.5rem;
    color: #00d9ff;
    font-weight: 600;
    font-size: 0.9rem;
  }
}

.detail-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    color: #fff;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      color: rgba(255, 255, 255, 0.8);
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
      
      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: #00d9ff;
      }
    }
  }
  
  p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }
}

.strengths h3 { color: #4ecdc4; }
.watch-outs h3 { color: #ffd93d; }
.approach h3 { color: #00d9ff; }

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.action-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  &.primary {
    background: linear-gradient(90deg, #00d9ff, #00ff88);
    color: #1a1a2e;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 217, 255, 0.4);
    }
  }
}

.timestamp {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
  margin-top: 2rem;
}

@media (max-width: 600px) {
  .result-view {
    padding: 1rem;
  }
  
  .type-card {
    padding: 2rem 1.5rem;
    
    .type-name {
      font-size: 2rem;
    }
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>
