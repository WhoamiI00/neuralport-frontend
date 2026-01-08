<template>
  <div class="assessment-view" :class="{ 'dark-mode': isDark }">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- PIN Verification Gate -->
    <div v-else-if="!pinVerified" class="pin-verification-container">
      <div class="pin-card">
        <div class="pin-icon">🎯</div>
        <h2>Who's Taking This Assessment?</h2>
        <p class="pin-subtitle">Enter the team member's PIN to identify them</p>
        
        <form @submit.prevent="handlePinSubmit" class="pin-form">
          <div class="pin-input-wrapper">
            <input
              v-model="pinInput"
              type="password"
              placeholder="Enter PIN"
              class="pin-input"
              :class="{ 'error': pinError }"
              maxlength="10"
              autocomplete="off"
            />
          </div>
          
          <p v-if="pinError" class="pin-error">{{ pinError }}</p>
          
          <button 
            type="submit" 
            class="pin-submit-btn"
            :disabled="!pinInput || verifying"
          >
            {{ verifying ? 'Verifying...' : 'Verify & Continue' }}
          </button>
        </form>
        
        <button @click="goBack" class="back-link">← Back to Dashboard</button>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadQuestions" class="retry-btn">Try Again</button>
    </div>

    <!-- Assessment Content -->
    <div v-else-if="currentQuestion" class="assessment-content">
      <!-- Header -->
      <div class="assessment-header">
        <h1>Performance Type Assessment</h1>
        <p class="subtitle">Discover how you perform best under pressure</p>
        <div v-if="mappedUserName" class="user-badge">
          <span class="user-icon">👤</span>
          <span>Assessment for: <strong>{{ mappedUserName }}</strong></span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">
          Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}
        </span>
      </div>

      <!-- Question Card -->
      <div class="question-card">
        <div class="axis-badge">
          {{ getAxisName(currentQuestion.axis) }}
        </div>
        
        <h2 class="question-text">{{ currentQuestion.text }}</h2>

        <!-- Answer Scale -->
        <div class="answer-scale">
          <div class="scale-labels">
            <span class="label-a">{{ currentQuestion.option_a }}</span>
            <span class="label-b">{{ currentQuestion.option_b }}</span>
          </div>
          
          <div class="scale-options">
            <label 
              v-for="value in 5" 
              :key="value"
              class="scale-option"
              :class="{ selected: answers[currentQuestion.id] === value }"
            >
              <input 
                type="radio" 
                :name="`question-${currentQuestion.id}`"
                :value="value"
                :checked="answers[currentQuestion.id] === value"
                @change="selectAnswer(value)"
              />
              <span class="option-circle">{{ value }}</span>
              <span class="option-label">{{ getScaleLabel(value) }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="navigation">
        <button 
          @click="previousQuestion" 
          :disabled="!canGoPrevious"
          class="nav-btn prev-btn"
        >
          ← Previous
        </button>
        
        <div class="question-dots">
          <span 
            v-for="(q, index) in questions" 
            :key="q.id"
            class="dot"
            :class="{ 
              active: index === currentQuestionIndex,
              answered: answers[q.id] !== undefined 
            }"
            @click="goToQuestion(index)"
          ></span>
        </div>

        <button 
          v-if="canGoNext"
          @click="nextQuestion" 
          :disabled="answers[currentQuestion.id] === undefined"
          class="nav-btn next-btn"
        >
          Next →
        </button>
        
        <button 
          v-else
          @click="handleSubmit"
          :disabled="!isComplete || submitting"
          class="nav-btn submit-btn"
        >
          {{ submitting ? 'Submitting...' : 'See Results' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '../stores/assessment'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useAssessmentStore()
const authStore = useAuthStore()
const { isDark } = useTheme()

const {
  questions,
  answers,
  currentQuestionIndex,
  loading,
  error,
  currentQuestion,
  progress,
  isComplete,
  canGoNext,
  canGoPrevious,
  totalQuestions,
  pinVerified,
  pinError,
  mappedUserName,
} = storeToRefs(store)

const submitting = ref(false)
const pinInput = ref('')
const verifying = ref(false)

const scaleLabels: Record<number, string> = {
  1: 'Strongly A',
  2: 'Slightly A',
  3: 'Neutral',
  4: 'Slightly B',
  5: 'Strongly B',
}

function getScaleLabel(value: number): string {
  return scaleLabels[value] || ''
}

function getAxisName(axisNumber: number): string {
  const axisNames: Record<number, string> = {
    1: 'Stimulus Processing',
    2: 'Cognitive Load Sensitivity',
    3: 'Switching Style',
    4: 'Recovery Preference',
  }
  return axisNames[axisNumber] || `Axis ${axisNumber}`
}

function selectAnswer(value: number) {
  if (currentQuestion.value) {
    store.setAnswer(currentQuestion.value.id, value)
  }
}

function nextQuestion() {
  store.nextQuestion()
}

function previousQuestion() {
  store.previousQuestion()
}

function goToQuestion(index: number) {
  store.goToQuestion(index)
}

async function handleSubmit() {
  submitting.value = true
  try {
    const result = await store.submitAssessment()
    router.push({ name: 'assessment-result', params: { id: result.id } })
  } catch (e) {
    console.error('Submit error:', e)
  } finally {
    submitting.value = false
  }
}

async function handlePinSubmit() {
  if (!pinInput.value) return
  
  verifying.value = true
  try {
    const success = await store.verifyPin(pinInput.value)
    if (success) {
      // PIN verified, now load questions
      await store.fetchQuestions()
    }
  } catch (e) {
    console.error('PIN verification error:', e)
  } finally {
    verifying.value = false
  }
}

function goBack() {
  router.push({ name: 'dashboard' })
}

async function loadQuestions() {
  store.reset()
  await store.fetchQuestions()
}

onMounted(async () => {
  // Check authentication status for different user types
  const isSuperadmin = !!localStorage.getItem('superadmin_token')
  const isPoolAdmin = !!localStorage.getItem('pool_admin_token')
  const isRegularUser = authStore.isAuthenticated && !isSuperadmin && !isPoolAdmin
  
  // Auto-verify only for regular logged-in users
  if (isRegularUser && authStore.user) {
    // Regular user - auto-verify with their ID
    store.setPinVerified(true)
    store.setMappedUser(parseInt(authStore.user.id), authStore.user.vr_name || `User ${authStore.user.id}`)
    await store.fetchQuestions()
  } else {
    // All admins (superadmin, pool admin) must enter PIN
    store.reset()
  }
})
</script>

<style scoped lang="scss">
.assessment-view {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  
  &.dark-mode {
    background: linear-gradient(135deg, #0a0a12 0%, #0f1419 100%);
  }
}

.loading-container,
.error-container,
.pin-verification-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #fff;
}

.pin-verification-container {
  min-height: 80vh;
}

.pin-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 400px;
  width: 100%;
  
  .pin-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
  }
  
  h2 {
    color: #fff;
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }
  
  .pin-subtitle {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.95rem;
    margin-bottom: 2rem;
  }
}

.pin-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.pin-input-wrapper {
  position: relative;
  width: 100%;
}

.pin-input {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1.25rem;
  text-align: center;
  letter-spacing: 0.25em;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &::placeholder {
    letter-spacing: normal;
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:focus {
    border-color: #00d9ff;
    background: rgba(0, 217, 255, 0.1);
  }
  
  &.error {
    border-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
}

.pin-error {
  color: #ff6b6b;
  font-size: 0.9rem;
  margin: 0;
}

.pin-submit-btn {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
  color: #1a1a2e;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  box-sizing: border-box;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 217, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.back-link {
  margin-top: 1.5rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.3s ease;
  
  &:hover {
    color: #00d9ff;
  }
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

.assessment-content {
  max-width: 800px;
  margin: 0 auto;
}

.assessment-header {
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    color: #fff;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
  }
  
  .user-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 217, 255, 0.15);
    border: 1px solid rgba(0, 217, 255, 0.3);
    border-radius: 20px;
    color: #00d9ff;
    font-size: 0.95rem;
    
    .user-icon {
      font-size: 1.1rem;
    }
    
    strong {
      color: #fff;
    }
  }
}

.progress-section {
  margin-bottom: 2rem;
  
  .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d9ff, #00ff88);
    transition: width 0.3s ease;
  }
  
  .progress-text {
    display: block;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
}

.question-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.axis-badge {
  display: inline-block;
  background: rgba(0, 217, 255, 0.2);
  color: #00d9ff;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.question-text {
  color: #fff;
  font-size: 1.4rem;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.answer-scale {
  .scale-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    
    span {
      max-width: 45%;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }
    
    .label-a {
      color: #ff6b6b;
    }
    
    .label-b {
      text-align: right;
      color: #4ecdc4;
    }
  }
  
  .scale-options {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
  
  .scale-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    
    input {
      position: absolute;
      opacity: 0;
    }
    
    .option-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.2s ease;
      margin-bottom: 0.5rem;
    }
    
    .option-label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
    }
    
    &:hover .option-circle {
      border-color: #00d9ff;
      color: #00d9ff;
    }
    
    &.selected .option-circle {
      background: #00d9ff;
      border-color: #00d9ff;
      color: #1a1a2e;
    }
  }
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.prev-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
}

.next-btn {
  background: #00d9ff;
  color: #1a1a2e;
  
  &:hover:not(:disabled) {
    background: #00b8d9;
  }
}

.submit-btn {
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  color: #1a1a2e;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 217, 255, 0.4);
  }
}

.question-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 400px;
  
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &.answered {
      background: rgba(0, 217, 255, 0.5);
    }
    
    &.active {
      background: #00d9ff;
      transform: scale(1.3);
    }
    
    &:hover {
      background: rgba(0, 217, 255, 0.7);
    }
  }
}

@media (max-width: 600px) {
  .assessment-view {
    padding: 1rem;
  }
  
  .question-card {
    padding: 1.5rem;
  }
  
  .question-text {
    font-size: 1.2rem;
  }
  
  .scale-option .option-circle {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .scale-option .option-label {
    display: none;
  }
  
  .question-dots {
    display: none;
  }
}
</style>
