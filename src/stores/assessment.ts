import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Types
export interface Question {
  id: number
  axis: number
  text: string
  option_a: string
  option_b: string
}

export interface AxisInfo {
  name: string
  questions: number[]
}

export interface PerformanceType {
  key: string
  name: string
  description: string
  strengths: string[]
  watch_outs: string[]
  approach: string
}

export interface AxisResult {
  name: string
  position: 'A' | 'MIDDLE' | 'B'
  b_count: number
}

export interface AssessmentResult {
  id: number
  performance_type: PerformanceType
  axis_results: {
    axis1: AxisResult
    axis2: AxisResult
    axis3: AxisResult
    axis4: AxisResult
  }
  created_at: string
}

export interface AssessmentSummary {
  id: number
  performance_type: {
    key: string
    name: string
    description: string
  }
  axis_positions: {
    axis1: string
    axis2: string
    axis3: string
    axis4: string
  }
  created_at: string
}

export const useAssessmentStore = defineStore('assessment', () => {
  // State
  const questions = ref<Question[]>([])
  const axes = ref<Record<number, AxisInfo>>({})
  const answers = ref<Record<number, number>>({})
  const currentQuestionIndex = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<AssessmentResult | null>(null)
  const history = ref<AssessmentSummary[]>([])
  const pinVerified = ref(false)
  const pinError = ref<string | null>(null)
  const mappedUserId = ref<number | null>(null)
  const mappedUserName = ref<string | null>(null)

  // Computed
  const totalQuestions = computed(() => questions.value.length)
  
  const currentQuestion = computed(() => 
    questions.value[currentQuestionIndex.value] || null
  )
  
  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0
    return Math.round((Object.keys(answers.value).length / totalQuestions.value) * 100)
  })
  
  const isComplete = computed(() => 
    Object.keys(answers.value).length === totalQuestions.value && totalQuestions.value > 0
  )
  
  const canGoNext = computed(() => 
    currentQuestionIndex.value < totalQuestions.value - 1
  )
  
  const canGoPrevious = computed(() => 
    currentQuestionIndex.value > 0
  )

  // Get auth token from localStorage
  function getAuthToken(): string | null {
    // Check for regular auth token
    const authToken = localStorage.getItem('auth_token')
    if (authToken) return authToken
    
    // Check for superadmin token
    const superadminToken = localStorage.getItem('superadmin_token')
    if (superadminToken) return superadminToken
    
    // Check for pool admin token
    const poolAdminToken = localStorage.getItem('pool_admin_token')
    if (poolAdminToken) return poolAdminToken
    
    return null
  }

  // Actions
  async function fetchQuestions() {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/assessments/questions/`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      
      const data = await response.json()
      questions.value = data.questions
      axes.value = data.axes
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitAssessment() {
    if (!isComplete.value) {
      throw new Error('Please answer all questions before submitting')
    }
    
    if (!mappedUserId.value) {
      throw new Error('User not identified. Please enter PIN first.')
    }
    
    loading.value = true
    error.value = null
    
    try {
      // Convert answers object to ordered array
      const answersArray = questions.value.map(q => answers.value[q.id])
      
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/assessments/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          answers: answersArray,
          user_id: mappedUserId.value  // Include user_id from PIN lookup
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit assessment')
      }
      
      const data = await response.json()
      result.value = data
      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory() {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/assessments/results/`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }
      
      const data = await response.json()
      history.value = data.results
      return data.results
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchResultDetail(id: number) {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/assessments/results/${id}/`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch result')
      }
      
      const data = await response.json()
      result.value = data
      return data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setAnswer(questionId: number, value: number) {
    answers.value[questionId] = value
  }

  function goToQuestion(index: number) {
    if (index >= 0 && index < totalQuestions.value) {
      currentQuestionIndex.value = index
    }
  }

  function nextQuestion() {
    if (canGoNext.value) {
      currentQuestionIndex.value++
    }
  }

  function previousQuestion() {
    if (canGoPrevious.value) {
      currentQuestionIndex.value--
    }
  }

  function reset() {
    answers.value = {}
    currentQuestionIndex.value = 0
    result.value = null
    error.value = null
    pinVerified.value = false
    pinError.value = null
    mappedUserId.value = null
    mappedUserName.value = null
  }

  async function verifyPin(pin: string, tenantId?: number): Promise<boolean> {
    loading.value = true
    pinError.value = null
    
    try {
      const token = getAuthToken()
      const requestBody: any = { pin }
      
      // Include tenant_id for admin sessions
      if (tenantId) {
        requestBody.tenant_id = tenantId
      }
      
      const response = await fetch(`${API_BASE_URL}/api/assessments/verify-pin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      if (response.ok && data.verified) {
        pinVerified.value = true
        mappedUserId.value = data.user_id
        mappedUserName.value = data.user_name
        return true
      } else {
        pinError.value = data.message || data.error || 'PIN not found'
        pinVerified.value = false
        mappedUserId.value = null
        mappedUserName.value = null
        return false
      }
    } catch (e) {
      pinError.value = e instanceof Error ? e.message : 'Lookup failed'
      pinVerified.value = false
      mappedUserId.value = null
      mappedUserName.value = null
      return false
    } finally {
      loading.value = false
    }
  }

  function setPinVerified(verified: boolean) {
    pinVerified.value = verified
  }

  function setMappedUser(userId: number, userName: string) {
    mappedUserId.value = userId
    mappedUserName.value = userName
  }

  return {
    // State
    questions,
    axes,
    answers,
    currentQuestionIndex,
    loading,
    error,
    result,
    history,
    pinVerified,
    pinError,
    mappedUserId,
    mappedUserName,
    
    // Computed
    totalQuestions,
    currentQuestion,
    progress,
    isComplete,
    canGoNext,
    canGoPrevious,
    
    // Actions
    fetchQuestions,
    submitAssessment,
    fetchHistory,
    fetchResultDetail,
    setAnswer,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    reset,
    verifyPin,
    setPinVerified,
    setMappedUser,
  }
})
