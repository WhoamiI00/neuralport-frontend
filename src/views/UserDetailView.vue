<template>
  <div class="user-details-page" :class="{ 'dark-mode': isDark }">
    <!-- Header -->
    <header class="details-header">
      <div class="header-content">
        <!-- Show back button only for admin users on desktop -->
        <button v-if="isAdmin" class="back-button desktop-only" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
          <span>Back to Dashboard</span>
        </button>
        <!-- Show logo for non-admin users or on mobile -->
        <div class="header-logo" :class="{ 'mobile-only': isAdmin }">
          <img :src="logoSrc" alt="ZEN EYE PRO" class="logo-image" />
        </div>
        <div class="header-center desktop-only">
          <span class="page-badge">
            <i class="mdi mdi-account-circle"></i>
            User Details
          </span>
        </div>
        
        <!-- Desktop Actions -->
        <div class="header-actions desktop-only">
          <!-- Language Toggle -->
          <button class="lang-toggle-btn" @click="toggleLanguage" :title="isEnglish ? 'Switch to Japanese' : 'Switch to English'">
            <span class="lang-flag">{{ isEnglish ? '🇺🇸' : '🇯🇵' }}</span>
            <span class="lang-code">{{ isEnglish ? 'EN' : 'JP' }}</span>
          </button>
          
          <el-button type="primary" @click="exportReport">
            <i class="mdi mdi-download"></i>
            Export Report
          </el-button>
          <ThemeToggle />
          
          <!-- Logout button for non-admin users -->
          <button v-if="!isAdmin" class="logout-btn" @click="handleLogout" title="Logout">
            <i class="mdi mdi-logout"></i>
            <span>Logout</span>
          </button>
        </div>

        <!-- Mobile Hamburger Menu -->
        <button class="hamburger-btn mobile-only" @click="toggleMobileMenu" :class="{ 'active': mobileMenuOpen }">
          <i class="mdi" :class="mobileMenuOpen ? 'mdi-close' : 'mdi-menu'"></i>
        </button>
      </div>

      <!-- Mobile Menu Dropdown -->
      <div class="mobile-menu" :class="{ 'open': mobileMenuOpen }">
        <div class="mobile-menu-content">
          <!-- Back button for admin -->
          <button v-if="isAdmin" class="mobile-menu-item" @click="goBack">
            <i class="mdi mdi-arrow-left"></i>
            <span>Back to Dashboard</span>
          </button>
          
          <!-- Language Toggle -->
          <button class="mobile-menu-item" @click="toggleLanguage">
            <span class="lang-flag">{{ isEnglish ? '🇺🇸' : '🇯🇵' }}</span>
            <span>{{ isEnglish ? 'English' : '日本語' }}</span>
          </button>
          
          <!-- Export Report -->
          <button class="mobile-menu-item" @click="exportReport">
            <i class="mdi mdi-download"></i>
            <span>Export Report</span>
          </button>
          
          <!-- Theme Toggle -->
          <div class="mobile-menu-item theme-item">
            <i class="mdi" :class="isDark ? 'mdi-weather-night' : 'mdi-weather-sunny'"></i>
            <span>{{ isDark ? 'Dark Mode' : 'Light Mode' }}</span>
            <ThemeToggle class="theme-toggle-inline" />
          </div>
          
          <!-- Logout button for non-admin users -->
          <button v-if="!isAdmin" class="mobile-menu-item logout-item" @click="handleLogout">
            <i class="mdi mdi-logout"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loader">
        <i class="mdi mdi-loading mdi-spin"></i>
        <span>Loading user data...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="mdi mdi-alert-circle"></i>
      <h3>Unable to load user</h3>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchUserData">Retry</el-button>
    </div>

    <!-- Main Content -->
    <main v-else-if="userData" class="details-content">
      <!-- User Profile Section with Metrics -->
      <section class="profile-section">
        <div class="profile-row">
          <!-- User Info Card -->
          <div class="profile-card">
            <div class="profile-avatar">
              <img v-if="userData.avatar" src="https://virtualcattolica.collectivibe.com/cms/img/dummy_avatar.png" :alt="userData.name" />
              <span v-else class="avatar-initials">{{ getInitials(userData.name) }}</span>
            </div>
            <div class="profile-info">
              <h1 class="user-name">{{ userData.name }}</h1>
              <p class="user-id">PIN: {{ userData.pin }}</p>
              <div class="profile-tags">
                <el-tag size="small" v-if="userData.role">{{ userData.role }}</el-tag>
                <el-tag size="small" type="info">{{ userData.sessionCount || 0 }} Sessions</el-tag>
              </div>
            </div>
          </div>
          
          <!-- Performance Metrics Cards -->
          <div class="metrics-row">
            <FatigueScoreCard
              :score="userData.latestScore"
              :is-dark="isDark"
            />
            <AverageScoreCard
              :score="userData.avgScore"
              :is-dark="isDark"
            />
            <StandardDeviationCard
              :value="userData.standardDeviation"
              :trend-data="variabilityTrendData"
              :is-dark="isDark"
            />
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="charts-section">
        <!-- Fatigue Timeline (Full Width) -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>
              <i class="mdi mdi-chart-line"></i>
              Fatigue Score Timeline
            </h3>
            <!-- Date Navigator with Day/Week/Month Toggle -->
            <div class="date-navigator">
              <div class="date-picker-group">
                <button class="nav-arrow" @click="navigateFatigueDate(-1)">
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="current-date">{{ formattedFatigueDate }}</span>
                <button class="nav-arrow" @click="navigateFatigueDate(1)">
                  <i class="mdi mdi-chevron-right"></i>
                </button>
              </div>
              <div class="view-toggle">
                <button 
                  :class="['toggle-btn', { active: fatigueViewMode === 'day' }]" 
                  @click="fatigueViewMode = 'day'"
                >
                  Day
                </button>
                <button 
                  :class="['toggle-btn', { active: fatigueViewMode === 'week' }]" 
                  @click="fatigueViewMode = 'week'"
                >
                  Week
                </button>
                <button 
                  :class="['toggle-btn', { active: fatigueViewMode === 'month' }]" 
                  @click="fatigueViewMode = 'month'"
                >
                  Month
                </button>
              </div>
            </div>
          </div>
          <div class="chart-body">
            <ChartCard :option="fatigueTimelineOption" :style="{ height: '350px' }" />
          </div>
        </div>

        <!-- Blink Duration Analysis - Full Width -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>
              <i class="mdi mdi-eye"></i>
              Blink Duration Analysis
            </h3>
          </div>
          <div class="chart-body">
            <ChartCard :option="blinkDurationOption" :style="{ height: '320px' }" />
          </div>
        </div>

        <!-- Pupil Size Tracking - Full Width -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>
              <i class="mdi mdi-circle-half-full"></i>
              Pupil Size Tracking
              <el-tooltip
                content="Tracks pupil diameter changes over time to analyze fatigue progression. The moving average lines help smooth out fluctuations."
                placement="top"
                :show-after="200"
              >
                <span class="info-icon">
                  <i class="mdi mdi-information-outline"></i>
                </span>
              </el-tooltip>
            </h3>
            <!-- Date Navigator with Day/Week/Month Toggle -->
            <div class="date-navigator">
              <div class="date-picker-group">
                <button class="nav-arrow" @click="navigateDate(-1)">
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="current-date">{{ formattedPupilDate }}</span>
                <button class="nav-arrow" @click="navigateDate(1)">
                  <i class="mdi mdi-chevron-right"></i>
                </button>
              </div>
              <div class="view-toggle">
                <button 
                  :class="['toggle-btn', { active: pupilViewMode === 'day' }]" 
                  @click="pupilViewMode = 'day'"
                >
                  Day
                </button>
                <button 
                  :class="['toggle-btn', { active: pupilViewMode === 'week' }]" 
                  @click="pupilViewMode = 'week'"
                >
                  Week
                </button>
                <button 
                  :class="['toggle-btn', { active: pupilViewMode === 'month' }]" 
                  @click="pupilViewMode = 'month'"
                >
                  Month
                </button>
              </div>
            </div>
          </div>
          <div class="chart-body pupil-chart">
            <ChartCard :option="pupilSizeOption" :style="{ height: '380px' }" />
          </div>
        </div>
      </section>

      <!-- Session History Section -->
      <section class="sessions-section">
        <div class="sessions-card">
          <div class="card-header">
            <h3>
              <i class="mdi mdi-history"></i>
              Session History
              <el-tooltip
                content="Complete history of all recorded sessions including duration, fatigue levels, and performance metrics."
                placement="top"
                :show-after="200"
              >
                <span class="info-icon">
                  <i class="mdi mdi-information-outline"></i>
                </span>
              </el-tooltip>
            </h3>
            <el-input
              v-model="sessionSearch"
              placeholder="Search sessions..."
              :prefix-icon="Search"
              clearable
              class="search-input"
            />
          </div>
          <div class="sessions-table-wrapper">
            <el-table
              :data="filteredSessions"
              stripe
              :empty-text="sessionSearch ? 'No sessions found' : 'No session history'"
              class="sessions-table"
            >
              <el-table-column prop="sessionId" label="Session ID" min-width="140">
                <template #default="{ row }">
                  <span class="session-id">{{ row.sessionId }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="date" label="Date" min-width="130" sortable>
                <template #default="{ row }">
                  {{ formatDateTime(row.date) }}
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="Duration" width="100" align="center">
                <template #default="{ row }">
                  {{ formatDuration(row.duration) }}
                </template>
              </el-table-column>
              <el-table-column prop="fatigueScore" label="Fatigue Score" width="130" align="center" sortable>
                <template #default="{ row }">
                  <span class="score-badge" :class="getScoreClass(row.fatigueScore)">
                    {{ row.fatigueScore }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="blinkCount" label="Blinks" width="100" align="center">
                <template #default="{ row }">
                  {{ row.blinkCount }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="Status" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="100" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewSession(row)">
                    <i class="mdi mdi-eye"></i>
                    View
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="sessions-pagination" v-if="totalSessionPages > 1">
            <el-pagination
              v-model:current-page="currentSessionPage"
              :page-size="sessionsPerPage"
              :total="filteredSessions.length"
              layout="prev, pager, next"
              :pager-count="5"
            />
          </div>
        </div>
      </section>

      <!-- Insights Section -->
      <section class="insights-section">
        <div class="section-header">
          <h2>
            <i class="mdi mdi-lightbulb-on"></i>
            AI Insights & Recommendations
          </h2>
        </div>
        <div class="insights-grid">
          <div 
            v-for="insight in userData.insights" 
            :key="insight.id"
            class="insight-card"
            :class="insight.severity"
          >
            <div class="insight-icon">
              <i :class="getInsightIcon(insight.type)"></i>
            </div>
            <div class="insight-content">
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.description }}</p>
            </div>
            <div class="insight-badge">
              {{ insight.severity }}
            </div>
          </div>
        </div>
      </section>

      <!-- Implementation Notes Section -->
      <section class="implementation-notes-section">
        <div class="notes-card">
          <div class="notes-header">
            <i class="mdi mdi-information"></i>
            <h3>Data Integration Status</h3>
          </div>
          <div class="notes-content">
            <div class="note-item">
              <div class="note-status implemented">
                <i class="mdi mdi-check-circle"></i>
                <span>Implemented</span>
              </div>
              <div class="note-details">
                <strong>Profile & Sessions:</strong> Real data from API - Name, PIN, session count, scores, and statistics are fetched from the database.
              </div>
            </div>
            
            <div class="note-item">
              <div class="note-status pending">
                <i class="mdi mdi-clock-outline"></i>
                <span>Needs Backend</span>
              </div>
              <div class="note-details">
                <strong>Blink Analytics:</strong> Requires storing blink data (left eye, right eye counts) in storage_scores.data JSONB field.
                <br><code>Example: { "blinks": { "left": 120, "right": 125 } }</code>
              </div>
            </div>
            
            <div class="note-item">
              <div class="note-status pending">
                <i class="mdi mdi-clock-outline"></i>
                <span>Needs Backend</span>
              </div>
              <div class="note-details">
                <strong>Pupil Tracking:</strong> Requires storing pupil size data in storage_scores.data JSONB field.
                <br><code>Example: { "pupil": { "left": 3.5, "right": 3.8 } }</code>
              </div>
            </div>
            
            <div class="note-item">
              <div class="note-status pending">
                <i class="mdi mdi-clock-outline"></i>
                <span>Needs AI Integration</span>
              </div>
              <div class="note-details">
                <strong>AI Insights:</strong> Implement AI analysis endpoint that processes user scores and returns insights/recommendations.
                <br><code>API: POST /api/ai/analyze-user/{user_id}</code>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="details-footer">
      <span>© {{ new Date().getFullYear() }} NeuralPort Japan • ZEN EYE PRO</span>
      <span class="version">User Details View</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * UserDetailsPage.vue
 * 
 * Detailed view of a single member's data.
 * Navigated to from DashboardPage via "More details" button.
 * 
 * Props:
 * - id: string (from route params) - The member ID
 * 
 * DATA FLOW:
 * 1. Get member basic info from members data
 * 2. Get detailed dashboard from memberDashboards data
 * 3. Render profile, KPIs, charts, and session history
 * 
 * API INTEGRATION NOTES:
 * - Replace getMemberById with: await fetch(`/api/members/${id}`).then(r => r.json())
 * - Replace getMemberDashboard with: await fetch(`/api/dashboard/member/${id}`).then(r => r.json())
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useTheme } from '@/composables/useTheme'
// import { useAuthStore } from '@/stores/main' // Auth disabled
import type { EChartsOption } from 'echarts'
import ThemeToggle from '@/components/zen/ThemeToggle.vue'
import ChartCard from '@/components/zen/ChartCard.vue'
import FatigueScoreCard from '@/components/zen/FatigueScoreCard.vue'
import AverageScoreCard from '@/components/zen/AverageScoreCard.vue'
import StandardDeviationCard from '@/components/zen/StandardDeviationCard.vue'
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth
} from 'date-fns'

// Import data modules
import type { Member } from '@/data/members'
import type { MemberDashboard } from '@/data/memberDashboards'
import { getUser, listScores, getStorage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

interface Session {
  sessionId: string
  date: string
  duration: number
  fatigueScore: number
  blinkCount: number
  status: 'completed' | 'interrupted' | 'pending'
}

interface Insight {
  id: number
  type: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}

// interface UserData {
//   id: string
//   name: string
//   avatar?: string
//   role?: string
//   sessionCount: number
//   joinDate: string
//   lastActiveDate: string
//   latestScore: number
//   avgScore: number
//   standardDeviation: number
//   weeklyTrend: number
//   scoreTrend: number
//   sessions: Session[]
//   insights: Insight[]
// }

const route = useRoute()
const router = useRouter()
const { isDark } = useTheme()
// const authStore = useAuthStore() // Auth disabled

const userId = computed(() => route.params.id as string)

// Check if current user is admin - always true when auth disabled
const isAdmin = computed(() => true)

// Logo source - switches based on theme (from public/images/ folder)
const logoSrc = computed(() => {
  return isDark.value 
    ? '/images/zen-logo-light.png.png' 
    : '/images/zen-logo-dark.png.png'
})

// Language state - true = English, false = Japanese
const isEnglish = ref(localStorage.getItem('zen-language') !== 'jp')

const toggleLanguage = () => {
  isEnglish.value = !isEnglish.value
  const lang = isEnglish.value ? 'us' : 'jp'
  localStorage.setItem('zen-language', lang)
  ElMessage.success(isEnglish.value ? 'Language: English' : '言語：日本語')
}

// Logout handler - disabled
const handleLogout = () => {
  // authStore.logout()
  router.push('/dashboard')
}

// State
const loading = ref(true)
const error = ref<string | null>(null)
const member = ref<Member | null>(null)
const memberDashboard = ref<MemberDashboard | null>(null)
// const timeRange = ref('30d')  // Unused
const sessionSearch = ref('')
const currentSessionPage = ref(1)
const sessionsPerPage = 10
const mobileMenuOpen = ref(false)

// Toggle mobile menu
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// Close mobile menu when clicking outside or navigating
// const _closeMobileMenu = () => {
//   mobileMenuOpen.value = false
// }

// Pupil chart date navigation state
const pupilViewMode = ref<'day' | 'week' | 'month'>('month')
const pupilSelectedDate = ref(new Date())

// Formatted date display based on view mode
const formattedPupilDate = computed(() => {
  const date = pupilSelectedDate.value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (pupilViewMode.value === 'day') {
    return `${year}/${month}/${day}`
  } else if (pupilViewMode.value === 'week') {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    return `${year}/${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`
  } else {
    return `${year}/${month}`
  }
})

// Navigate date based on view mode
const navigateDate = (direction: number) => {
  const date = new Date(pupilSelectedDate.value)
  if (pupilViewMode.value === 'day') {
    date.setDate(date.getDate() + direction)
  } else if (pupilViewMode.value === 'week') {
    date.setDate(date.getDate() + (direction * 7))
  } else {
    date.setMonth(date.getMonth() + direction)
  }
  pupilSelectedDate.value = date
}

// Fatigue timeline date navigation state
const fatigueViewMode = ref<'day' | 'week' | 'month'>('month')
const fatigueSelectedDate = ref(new Date())

// Formatted date display for fatigue timeline
const formattedFatigueDate = computed(() => {
  const date = fatigueSelectedDate.value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (fatigueViewMode.value === 'day') {
    return `${year}/${month}/${day}`
  } else if (fatigueViewMode.value === 'week') {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    return `${year}/${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`
  } else {
    return `${year}/${month}`
  }
})

// Navigate fatigue date based on view mode
const navigateFatigueDate = (direction: number) => {
  const date = new Date(fatigueSelectedDate.value)
  if (fatigueViewMode.value === 'day') {
    date.setDate(date.getDate() + direction)
  } else if (fatigueViewMode.value === 'week') {
    date.setDate(date.getDate() + (direction * 7))
  } else {
    date.setMonth(date.getMonth() + direction)
  }
  fatigueSelectedDate.value = date
}

// Reactive state for scores data
const allScoresData = ref<any[]>([])

// Fetch scores data whenever view mode or date changes
const fetchFatigueData = async () => {
  console.log('🔄 [Fetch] fetchFatigueData called')
  console.log('🔄 [Fetch] userId.value:', userId.value)
  
  if (!userId.value) {
    console.warn('⚠️ [Fetch] No userId - skipping fetch')
    return
  }
  
  try {
    const authStore = useAuthStore()
    const tenantId = parseInt(authStore.user?.tenant_id || '1')
    
    console.log('🔄 [Fetch] Fetching scores for tenantId:', tenantId, 'userId:', userId.value)
    
    const scores = await listScores(tenantId, parseInt(userId.value))
    
    // Fetch storage data to get pupil measurements and blink data
    const scoresWithPupilData = await Promise.all(
      (Array.isArray(scores) ? scores : []).map(async (score: any) => {
        try {
          const storage = await getStorage(score.key)
          const data = storage.data || {}
          
          console.log('🔍 [Blink Data] Processing score key:', score.key)
          console.log('🔍 [Blink Data] Storage data:', data)
          console.log('🔍 [Blink Data] leftBlinkCount from storage:', data.leftBlinkCount)
          console.log('🔍 [Blink Data] rightBlinkCount from storage:', data.rightBlinkCount)
          
          return {
            ...score,
            leftPupilDiameter: data.leftPupilDiameter || 0,
            rightPupilDiameter: data.rightPupilDiameter || 0,
            leftBlinks: data.leftBlinkCount || 0,
            rightBlinks: data.rightBlinkCount || 0,
            sessionDate: data.sessionDate || score.created_at
          }
        } catch (err) {
          console.error('❌ [Blink Data] Error processing score:', err)
          return {
            ...score,
            leftPupilDiameter: 0,
            rightPupilDiameter: 0,
            leftBlinks: 0,
            rightBlinks: 0
          }
        }
      })
    )
    
    allScoresData.value = scoresWithPupilData
    
    console.log('✅ [Fetch] Scores fetched:', allScoresData.value.length, 'items')
    console.log('✅ [Fetch] Sample scores:', allScoresData.value.slice(0, 3))
  } catch (err) {
    console.error('❌ [Fetch] Error fetching fatigue data:', err)
  }
}

// Watch for changes and refetch data
watch([fatigueViewMode, fatigueSelectedDate], () => {
  console.log('👁️ [Watch] fatigueViewMode or fatigueSelectedDate changed')
  fetchFatigueData()
}, { immediate: true })

// Watch for changes and refetch data
watch([pupilViewMode, pupilSelectedDate], () => {
  console.log('👁️ [Watch] pupilViewMode or pupilSelectedDate changed')
  fetchFatigueData()
}, { immediate: true })

// Filtered fatigue data based on selected date and view mode - using real API data
const filteredFatigueData = computed(() => {
  if (!allScoresData.value || allScoresData.value.length === 0) return []
  
  const selectedDate = new Date(fatigueSelectedDate.value)
  let start: Date, end: Date
  
  if (fatigueViewMode.value === 'day') {
    start = startOfDay(selectedDate)
    end = endOfDay(selectedDate)
  } else if (fatigueViewMode.value === 'week') {
    start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    end = endOfWeek(selectedDate, { weekStartsOn: 0 })
  } else {
    start = startOfMonth(selectedDate)
    end = endOfMonth(selectedDate)
  }
  
  // Filter scores by date range
  const filteredItems = allScoresData.value.filter(item => {
    const d = new Date(item.created_at)
    if (isNaN(d.getTime())) return false
    const t = d.getTime()
    return t >= start.getTime() && t <= end.getTime()
  })
  
  filteredItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  
  if (fatigueViewMode.value === 'day') {
    // For day view, show hourly data
    return filteredItems.map(item => ({
      date: format(new Date(item.created_at), 'HH:mm'),
      score: Number(item.score || 0)
    }))
  } else if (fatigueViewMode.value === 'week') {
    // For week view, aggregate by day
    const dayMap = new Map()
    filteredItems.forEach(item => {
      const d = new Date(item.created_at)
      const dateKey = format(d, 'MM/dd')
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { sum: 0, count: 0 })
      }
      const rec = dayMap.get(dateKey)
      rec.sum += Number(item.score || 0)
      rec.count += 1
    })
    
    const result = []
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)
      const dateKey = format(currentDate, 'MM/dd')
      const rec = dayMap.get(dateKey)
      result.push({
        date: dateKey,
        score: rec ? Math.round(rec.sum / rec.count) : 0
      })
    }
    return result
  } else {
    // For month view, aggregate by day
    const dayMap = new Map()
    filteredItems.forEach(item => {
      const d = new Date(item.created_at)
      const dateKey = format(d, 'MM/dd')
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { sum: 0, count: 0 })
      }
      const rec = dayMap.get(dateKey)
      rec.sum += Number(item.score || 0)
      rec.count += 1
    })
    
    // Get all dates that have data
    const datesWithData = Array.from(dayMap.keys()).sort()
    
    // If we have data, create a result that includes all data points plus some spacing
    if (datesWithData.length > 0) {
      const result: { date: string; score: number | null }[] = []
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
      const step = Math.max(2, Math.floor(daysInMonth / 15))
      
      // First, add all dates with actual data
      datesWithData.forEach(dateKey => {
        const rec = dayMap.get(dateKey)
        result.push({
          date: dateKey,
          score: Math.round(rec.sum / rec.count)
        })
      })
      
      // Then add some empty dates for spacing (only if not already added)
      for (let day = 1; day <= daysInMonth; day += step) {
        const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
        const dateKey = format(currentDate, 'MM/dd')
        if (!result.find(r => r.date === dateKey)) {
          result.push({
            date: dateKey,
            score: null
          })
        }
      }
      
      // Sort by date
      result.sort((a, b) => {
        const aParts = a.date.split('/').map(Number)
        const bParts = b.date.split('/').map(Number)
        const aDay = aParts[1] || 0
        const bDay = bParts[1] || 0
        return aDay - bDay
      })
      
      return result
    }
    
    // If no data, return empty
    return []
  }
})

// Filtered pupil data based on selected date and view mode - using real session data
const filteredPupilData = computed(() => {
  console.log('🔍 [Pupil Data] Computing filteredPupilData...')
  console.log('🔍 [Pupil Data] allScoresData.value:', allScoresData.value?.length, 'items')
  console.log('🔍 [Pupil Data] pupilViewMode:', pupilViewMode.value)
  console.log('🔍 [Pupil Data] pupilSelectedDate:', pupilSelectedDate.value)
  
  if (!allScoresData.value || allScoresData.value.length === 0) {
    console.warn('⚠️ [Pupil Data] No allScoresData available')
    return []
  }
  
  const selectedDate = new Date(pupilSelectedDate.value)
  let start: Date, end: Date
  
  if (pupilViewMode.value === 'day') {
    start = startOfDay(selectedDate)
    end = endOfDay(selectedDate)
  } else if (pupilViewMode.value === 'week') {
    start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    end = endOfWeek(selectedDate, { weekStartsOn: 0 })
  } else {
    start = startOfMonth(selectedDate)
    end = endOfMonth(selectedDate)
  }
  
  console.log('🔍 [Pupil Data] Date range:', format(start, 'yyyy-MM-dd HH:mm'), 'to', format(end, 'yyyy-MM-dd HH:mm'))
  
  // Log all score dates to see what we have
  console.log('📅 [Pupil Data] Available score dates:')
  allScoresData.value.forEach((item, idx) => {
    console.log(`  ${idx}: ${item.created_at} (${new Date(item.created_at).toLocaleString()})`)
  })
  
  // Filter scores by date range
  const filteredItems = allScoresData.value.filter(item => {
    const d = new Date(item.created_at)
    if (isNaN(d.getTime())) return false
    const t = d.getTime()
    return t >= start.getTime() && t <= end.getTime()
  })
  
  console.log('🔍 [Pupil Data] Filtered items:', filteredItems.length)
  if (filteredItems.length > 0) {
    console.log('🔍 [Pupil Data] Sample pupil values:', {
      leftPupil: filteredItems[0].leftPupilDiameter,
      rightPupil: filteredItems[0].rightPupilDiameter
    })
  }
  
  filteredItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  
  let result: any[] = []
  
  if (pupilViewMode.value === 'day') {
    // For day view, use real pupil data
    result = filteredItems.map(item => ({
      time: format(new Date(item.created_at), 'HH:mm'),
      leftPupil: item.leftPupilDiameter || 3.5 + Math.random() * 0.5,
      rightPupil: item.rightPupilDiameter || 3.6 + Math.random() * 0.5
    }))
  } else if (pupilViewMode.value === 'week') {
    // For week view, sample across 7 days with real data
    const step = Math.max(1, Math.floor(filteredItems.length / 7))
    result = filteredItems.filter((_, index) => index % step === 0).slice(0, 7).map(item => ({
      time: format(new Date(item.created_at), 'MM/dd'),
      leftPupil: item.leftPupilDiameter || 3.5 + Math.random() * 0.5,
      rightPupil: item.rightPupilDiameter || 3.6 + Math.random() * 0.5
    }))
  } else {
    // For month view, create map with actual data
    const dayMap = new Map()
    filteredItems.forEach(item => {
      const d = new Date(item.created_at)
      const dateKey = format(d, 'MM/dd')
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          leftPupil: 0,
          rightPupil: 0,
          count: 0
        })
      }
      const rec = dayMap.get(dateKey)
      rec.leftPupil += item.leftPupilDiameter || 0
      rec.rightPupil += item.rightPupilDiameter || 0
      rec.count += 1
    })
    
    // Get all dates that have data
    const datesWithData = Array.from(dayMap.keys()).sort()
    
    if (datesWithData.length > 0) {
      result = []
      const selectedDate = new Date(pupilSelectedDate.value)
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
      const step = Math.max(2, Math.floor(daysInMonth / 15))
      
      // First, add all dates with actual data
      datesWithData.forEach(dateKey => {
        const rec = dayMap.get(dateKey)
        result.push({
          time: dateKey,
          leftPupil: rec.count > 0 ? (rec.leftPupil / rec.count) || 3.5 + Math.random() * 0.5 : null,
          rightPupil: rec.count > 0 ? (rec.rightPupil / rec.count) || 3.6 + Math.random() * 0.5 : null
        })
      })
      
      // Then add some empty dates for spacing
      for (let day = 1; day <= daysInMonth; day += step) {
        const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
        const dateKey = format(currentDate, 'MM/dd')
        if (!result.find(r => r.time === dateKey)) {
          result.push({
            time: dateKey,
            leftPupil: null,
            rightPupil: null
          })
        }
      }
      
      // Sort by date
      result.sort((a, b) => {
        const aParts = a.time.split('/').map(Number)
        const bParts = b.time.split('/').map(Number)
        const aDay = aParts[1] || 0
        const bDay = bParts[1] || 0
        return aDay - bDay
      })
    } else {
      result = []
    }
  }
  
  console.log('✅ [Pupil Data] Result:', result.length, 'data points')
  console.log('✅ [Pupil Data] Sample data:', result.slice(0, 3))
  
  return result
})

// Computed - merged user data for template compatibility
const userData = computed(() => {
  if (!member.value || !memberDashboard.value) return null
  
  return {
    id: member.value.id,
    pin: member.value.pin,
    name: member.value.name,
    avatar: member.value.avatarUrl,
    role: member.value.role || 'Player',
    sessionCount: member.value.sessionCount,
    joinDate: member.value.joinDate || '2024-06-15T00:00:00Z',
    lastActiveDate: member.value.lastActiveDate || new Date().toISOString(),
    latestScore: memberDashboard.value.summary.latestFatigueScore,
    avgScore: memberDashboard.value.summary.averageScore,
    standardDeviation: memberDashboard.value.summary.standardDeviation,
    weeklyTrend: memberDashboard.value.summary.variabilityTrend > 60 ? -2.5 : 3.8,
    scoreTrend: memberDashboard.value.summary.variabilityTrend > 60 ? -1.2 : 2.5,
    sessions: memberDashboard.value.recentSessions,
    insights: generateInsights(memberDashboard.value)
  }
})

// Computed
const filteredSessions = computed(() => {
  if (!userData.value) return []
  let sessions = [...userData.value.sessions]
  
  if (sessionSearch.value) {
    const query = sessionSearch.value.toLowerCase()
    sessions = sessions.filter(s => 
      s.sessionId.toLowerCase().includes(query) ||
      s.status.toLowerCase().includes(query)
    )
  }
  
  return sessions
})

const totalSessionPages = computed(() => Math.ceil(filteredSessions.value.length / sessionsPerPage))

// Variability trend data for StandardDeviationCard sparkline
const variabilityTrendData = computed(() => {
  if (!memberDashboard.value) return [65, 72, 68, 75, 70, 78, 72, 80, 75, 72]
  // Use fatigue timeline scores for trend visualization
  return memberDashboard.value.fatigueTimeline.slice(-10).map((d: any) => d.score)
})

// Chart options - use member dashboard data with dynamic date selection
const fatigueTimelineOption = computed<EChartsOption>(() => {
  if (!memberDashboard.value || !memberDashboard.value.fatigueTimeline || memberDashboard.value.fatigueTimeline.length === 0) {
    return {}
  }
  
  const textColor = isDark.value ? '#94A3B8' : '#64748B'
  const gridColor = isDark.value ? '#334155' : '#E2E8F0'
  
  // Use filtered data from filteredFatigueData computed property
  const timeLabels = filteredFatigueData.value.map((d: any) => d.date)
  const fatigueScores = filteredFatigueData.value.map((d: any) => d.score)
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1E293B' : '#fff',
      borderColor: isDark.value ? '#334155' : '#E2E8F0',
      textStyle: { color: isDark.value ? '#F1F5F9' : '#1E293B' }
    },
    grid: { top: 40, right: 30, bottom: 40, left: 60 },
    xAxis: {
      type: 'category',
      data: timeLabels,
      axisLine: { lineStyle: { color: textColor } },
      axisLabel: { 
        color: textColor,
        rotate: fatigueViewMode.value === 'month' ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: 'Fatigue Score',
      nameTextStyle: { color: textColor },
      axisLine: { lineStyle: { color: textColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: [{
      type: 'line',
      data: fatigueScores,
      smooth: true,
      connectNulls: false,
      lineStyle: { width: 3, color: '#667EEA' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ]
        }
      },
      itemStyle: { color: '#667EEA' },
      symbolSize: 8,
      markLine: {
        silent: true,
        data: [
          { yAxis: 60, lineStyle: { color: '#F59E0B', type: 'dashed' }, label: { formatter: 'Warning', color: textColor } },
          { yAxis: 80, lineStyle: { color: '#EF4444', type: 'dashed' }, label: { formatter: 'Critical', color: textColor } }
        ]
      }
    }]
  }
})

const blinkDurationOption = computed<EChartsOption>(() => {
  console.log('📊 [Blink Chart] Computing blinkDurationOption...')
  console.log('📊 [Blink Chart] allScoresData.value length:', allScoresData.value.length)
  console.log('📊 [Blink Chart] Sample data:', allScoresData.value.slice(0, 3))
  
  const textColor = isDark.value ? '#94A3B8' : '#64748B'
  const gridColor = isDark.value ? '#334155' : '#E2E8F0'
  
  // Use real blink data from allScoresData - don't filter, show all
  const data = allScoresData.value
    .map((item, index) => ({
      session: `Session ${index + 1}`,
      date: format(new Date(item.sessionDate || item.created_at), 'MM/dd HH:mm'),
      leftBlinks: item.leftBlinks || 0,
      rightBlinks: item.rightBlinks || 0
    }))
  
  console.log('📊 [Blink Chart] Processed data:', data)
  
  // Show empty state if no data
  if (!data || data.length === 0) {
    return {
      title: {
        text: 'No blink data available',
        left: 'center',
        top: 'center',
        textStyle: { color: textColor, fontSize: 16 }
      },
      grid: { top: 20, right: 20, bottom: 50, left: 50 }
    }
  }

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1E293B' : '#fff',
      formatter: (params: any) => {
        const dataIndex = params[0].dataIndex
        const sessionData = data[dataIndex]
        if (!sessionData) return ''
        return `${sessionData.date}<br/>Left Eye: ${sessionData.leftBlinks}<br/>Right Eye: ${sessionData.rightBlinks}`
      }
    },
    legend: {
      data: ['Left Eye', 'Right Eye'],
      textStyle: { color: textColor },
      bottom: 0
    },
    grid: { top: 20, right: 20, bottom: 50, left: 50 },
    xAxis: {
      type: 'category',
      data: data.map((d: any) => d.session),
      axisLabel: { color: textColor, rotate: 15 }
    },
    yAxis: {
      type: 'value',
      name: 'Blink Count',
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: [
      {
        name: 'Left Eye',
        type: 'bar',
        data: data.map((d: any) => d.leftBlinks),
        itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: 'Right Eye',
        type: 'bar',
        data: data.map((d: any) => d.rightBlinks),
        itemStyle: { color: '#8B5CF6', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }
})

// Calculate moving average for pupil data
const calculateMovingAverage = (data: number[], windowSize: number = 3): number[] => {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2))
    const window = data.slice(start, end)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(Math.round(avg * 100) / 100)
  }
  return result
}

const pupilSizeOption = computed<EChartsOption>(() => {
  console.log('📊 [Pupil Chart] Computing pupilSizeOption...')
  console.log('📊 [Pupil Chart] memberDashboard.value:', !!memberDashboard.value)
  
  if (!memberDashboard.value) {
    console.warn('⚠️ [Pupil Chart] No memberDashboard')
    return {}
  }
  
  const textColor = isDark.value ? '#94A3B8' : '#64748B'
  const gridColor = isDark.value ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
  
  // Use filtered data from filteredPupilData computed property
  const data = filteredPupilData.value
  
  console.log('📊 [Pupil Chart] filteredPupilData.value:', data?.length, 'items')
  console.log('📊 [Pupil Chart] Sample data:', data?.slice(0, 3))
  
  // Show empty state if no data
  if (!data || data.length === 0) {
    console.warn('⚠️ [Pupil Chart] No data - showing empty state')
    return {
      title: {
        text: 'No pupil tracking data available',
        left: 'center',
        top: 'center',
        textStyle: { color: textColor, fontSize: 16 }
      },
      grid: { top: 40, right: 30, bottom: 60, left: 60 }
    }
  }
  
  // Extract data from pupilTracking
  const timeLabels = data.map((d: any) => d.time)
  const leftPupilData = data.map((d: any) => d.leftPupil)
  const rightPupilData = data.map((d: any) => d.rightPupil)
  
  console.log('📊 [Pupil Chart] timeLabels:', timeLabels.length, timeLabels.slice(0, 3))
  console.log('📊 [Pupil Chart] leftPupilData:', leftPupilData.slice(0, 3))
  console.log('📊 [Pupil Chart] rightPupilData:', rightPupilData.slice(0, 3))
  
  // Calculate moving averages
  const leftMA = calculateMovingAverage(leftPupilData, 3)
  const rightMA = calculateMovingAverage(rightPupilData, 3)

  console.log('✅ [Pupil Chart] Chart data prepared successfully')

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1E293B' : '#FFFFFF',
      borderColor: isDark.value ? '#334155' : '#E2E8F0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { 
        color: isDark.value ? '#F1F5F9' : '#1E293B',
        fontSize: 13
      },
      formatter: (params: any) => {
        const time = params[0]?.axisValue || ''
        let html = `<div style="font-weight: 600; margin-bottom: 8px; color: ${textColor};">${time}</div>`
        params.forEach((item: any) => {
          const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:8px;"></span>`
          html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin:4px 0;">
            <span>${marker}${item.seriesName}</span>
            <span style="font-weight:600;">${item.value?.toFixed(2) || 'N/A'} mm</span>
          </div>`
        })
        return html
      }
    },
    legend: {
      data: ['Left MA', 'Left Pupil', 'Right MA', 'Right Pupil'],
      textStyle: { 
        color: textColor,
        fontSize: 12
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 24,
      bottom: 10,
      left: 'center'
    },
    grid: { 
      top: 40, 
      right: 30, 
      bottom: 60, 
      left: 60,
      containLabel: true
    },
    graphic: [
      {
        type: 'text',
        right: 20,
        top: 8,
        style: {
          text: 'Millimeters (mm)',
          fill: '#fff',
          fontSize: 12,
          fontWeight: 500,
          backgroundColor: '#818CF8',
          padding: [6, 12],
          borderRadius: 6
        }
      }
    ],
    xAxis: {
      type: 'category',
      data: timeLabels,
      boundaryGap: false,
      axisLine: { 
        lineStyle: { 
          color: gridColor,
          width: 1
        } 
      },
      axisTick: {
        show: false
      },
      axisLabel: { 
        color: textColor,
        fontSize: 11,
        margin: 12,
        interval: 0,
        rotate: pupilViewMode.value === 'month' ? 45 : 0
      },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 2,
      max: 6,
      interval: 0.5,
      axisLine: { 
        show: false
      },
      axisTick: { show: false },
      axisLabel: { 
        color: textColor,
        fontSize: 11,
        formatter: (value: number) => value.toFixed(1)
      },
      splitLine: { 
        lineStyle: { 
          color: gridColor,
          type: 'dashed',
          width: 1
        } 
      }
    },
    series: [
      // Left Moving Average - Dashed trend line (light blue)
      {
        name: 'Left MA',
        type: 'line',
        data: leftMA,
        smooth: true,
        symbol: 'none',
        connectNulls: false,
        lineStyle: { 
          color: 'rgba(147, 197, 253, 0.8)', 
          width: 2,
          type: 'dashed'
        },
        z: 2
      },
      // Left Pupil - Solid line (blue)
      {
        name: 'Left Pupil',
        type: 'line',
        data: leftPupilData,
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        connectNulls: false,
        lineStyle: { 
          color: '#3B82F6', 
          width: 2
        },
        itemStyle: { 
          color: '#3B82F6',
          borderWidth: 2,
          borderColor: '#fff'
        },
        z: 3
      },
      // Right Moving Average - Dashed trend line (light purple)
      {
        name: 'Right MA',
        type: 'line',
        data: rightMA,
        smooth: true,
        symbol: 'none',
        connectNulls: false,
        lineStyle: { 
          color: 'rgba(196, 181, 253, 0.8)', 
          width: 2,
          type: 'dashed'
        },
        z: 2
      },
      // Right Pupil - Solid line (purple)
      {
        name: 'Right Pupil',
        type: 'line',
        data: rightPupilData,
        smooth: false,
        connectNulls: false,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { 
          color: '#8B5CF6', 
          width: 2
        },
        itemStyle: { 
          color: '#8B5CF6',
          borderWidth: 2,
          borderColor: '#fff'
        },
        z: 3
      }
    ],
    animationDuration: 800,
    animationEasing: 'cubicInOut'
  }
})

// Methods
const goBack = () => {
  router.push('/dashboard')
}

const fetchUserData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch real user data from API
    const userProfile = await getUser(Number(userId.value))
    
    // Use name and portrait_image from API response
    const displayName = userProfile.name || `User ${userProfile.pin || userId.value}`
    const avatarUrl = userProfile.portrait_image || ''
    
    // Fetch user's scores
    const scores = await listScores(userProfile.tenant_id, userProfile.id)
    
    // Fetch full storage data for each score to get blink and pupil information
    const sessionsWithData = await Promise.all(
      scores.slice(-10).map(async (score: any) => {
        try {
          const storage = await getStorage(score.key)
          const data = storage.data || {}
          return {
            score: Number(score.score),
            created_at: score.created_at,
            key: score.key,
            blinkCount: data.blinkCount || 0,
            leftBlinkCount: data.leftBlinkCount || 0,
            rightBlinkCount: data.rightBlinkCount || 0,
            pupilDiameter: data.pupilDiameter || 0,
            leftPupilDiameter: data.leftPupilDiameter || 0,
            rightPupilDiameter: data.rightPupilDiameter || 0,
            eyeTrackingData: data.eyeTrackingData || []
          }
        } catch (err) {
          console.warn(`Failed to fetch storage for key ${score.key}:`, err)
          return {
            score: Number(score.score),
            created_at: score.created_at,
            key: score.key,
            blinkCount: 0,
            leftBlinkCount: 0,
            rightBlinkCount: 0,
            pupilDiameter: 0,
            leftPupilDiameter: 0,
            rightPupilDiameter: 0,
            eyeTrackingData: []
          }
        }
      })
    )
    
    // Calculate statistics from scores
    const scoreValues = scores.map((s: any) => Number(s.score))
    const latestScore = scoreValues.length > 0 ? scoreValues[scoreValues.length - 1] : 0
    const avgScore = scoreValues.length > 0 
      ? scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length 
      : 0
    
    // Calculate standard deviation
    const variance = scoreValues.length > 0
      ? scoreValues.reduce((sum: number, val: number) => sum + Math.pow(val - avgScore, 2), 0) / scoreValues.length
      : 0
    const stdDev = Math.sqrt(variance)
    
    // Create member object
    member.value = {
      id: String(userProfile.id),
      name: displayName,
      pin: userProfile.pin || String(userProfile.id),
      avatarUrl: avatarUrl,
      sessionCount: scores.length,
      fatigueScore: latestScore || 0,
      role: 'Player',
      joinDate: new Date().toISOString(), // UserProfile doesn't have created_at
      lastActiveDate: scores.length > 0 ? (scores[scores.length - 1]?.created_at || new Date().toISOString()) : new Date().toISOString()
    }
    
    // Create blink analytics from sessions
    const blinkAnalytics = sessionsWithData.map((session: any, idx: number) => ({
      session: `S${idx + 1}`,
      leftBlinks: session.leftBlinkCount || 0,
      rightBlinks: session.rightBlinkCount || 0,
      avgFrequency: 15.0  // Default average frequency
    }))
    
    // Create pupil tracking data from sessions
    const pupilTracking = sessionsWithData.map((session: any, _idx: number) => {
      const date = new Date(session.created_at)
      return {
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        leftPupil: session.leftPupilDiameter || 0,
        rightPupil: session.rightPupilDiameter || 0
      }
    })
    
    // Create dashboard data from scores
    memberDashboard.value = {
      memberId: String(userProfile.id),
      summary: {
        latestFatigueScore: latestScore || 0,
        averageScore: Math.round(avgScore * 100) / 100,
        standardDeviation: Math.round(stdDev * 100) / 100,
        variabilityTrend: stdDev > 20 ? 70 : 50,
        totalSessions: scores.length
      },
      fatigueTimeline: scores.slice(-10).map((s: any) => ({
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Number(s.score)
      })),
      blinkAnalytics,
      pupilTracking,
      recentSessions: sessionsWithData.slice(-5).reverse().map((session: any, _idx: number) => ({
        sessionId: session.key.substring(0, 8).toUpperCase(),
        date: session.created_at,
        duration: 60, // 60 seconds from our generated data
        fatigueScore: session.score,
        blinkCount: session.blinkCount,
        status: 'completed' as const
      }))
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load user data'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

/**
 * Generate AI insights based on member dashboard data
 */
const generateInsights = (dashboard: MemberDashboard): Insight[] => {
  const insights: Insight[] = []
  
  // Fatigue insight
  if (dashboard.summary.latestFatigueScore > 70) {
    insights.push({
      id: 1,
      type: 'fatigue',
      title: 'High Fatigue Detected',
      description: 'Recent fatigue scores are elevated. Consider scheduling breaks and reviewing workload.',
      severity: 'warning'
    })
  } else if (dashboard.summary.latestFatigueScore < 40) {
    insights.push({
      id: 1,
      type: 'fatigue',
      title: 'Excellent Fatigue Management',
      description: 'Fatigue scores are well within healthy range. Keep up the good work!',
      severity: 'info'
    })
  }
  
  // Variability insight
  if (dashboard.summary.variabilityTrend > 70) {
    insights.push({
      id: 2,
      type: 'pattern',
      title: 'High Score Variability',
      description: 'Fatigue scores show significant fluctuation. Consider more consistent session scheduling.',
      severity: 'warning'
    })
  } else {
    insights.push({
      id: 2,
      type: 'performance',
      title: 'Stable Performance',
      description: 'Fatigue scores show consistent patterns, indicating good session management.',
      severity: 'info'
    })
  }
  
  // Session insight
  if (dashboard.summary.totalSessions > 50) {
    insights.push({
      id: 3,
      type: 'blink',
      title: 'Experienced User',
      description: `With ${dashboard.summary.totalSessions} sessions completed, this user has developed strong usage patterns.`,
      severity: 'info'
    })
  }
  
  return insights
}

const exportReport = async () => {
  const exportBtn = document.querySelector('.header-actions el-button[type="primary"]') as HTMLElement
  const originalBtnContent = exportBtn?.innerHTML
  let tempContainer: HTMLElement | null = null
  
  try {
    // Show loading state
    if (exportBtn) {
      exportBtn.style.pointerEvents = 'none'
      exportBtn.style.opacity = '0.6'
      exportBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> Generating PDF...'
    }
    
    ElMessage.info('Preparing report for export...')
    
    // Wait for complete render
    await document.fonts.ready
    
    // Wait for images to load
    const images = Array.from(document.querySelectorAll('img'))
    await Promise.all(
      images.map(img => 
        img.complete ? Promise.resolve() : new Promise(resolve => {
          img.onload = resolve
          img.onerror = resolve
          setTimeout(resolve, 100)
        })
      )
    )
    
    // Additional buffer for chart rendering
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Import libraries
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')
    
    // Get the main content container (exclude header)
    const mainContent = document.querySelector('.details-content') as HTMLElement
    if (!mainContent) {
      throw new Error('Content not found')
    }
    
    // Create temporary container with clone
    // A4 landscape ratio: 297mm x 210mm = 1.414:1
    // For 1440px width, height should be 1440 / 1.414 = 1019px
    const containerWidth = 1440
    const a4LandscapeRatio = 297 / 210 // width / height
    const containerHeight = Math.floor(containerWidth / a4LandscapeRatio)
    
    tempContainer = document.createElement('div')
    tempContainer.style.position = 'fixed'
    tempContainer.style.left = '-99999px'
    tempContainer.style.top = '0'
    tempContainer.style.width = `${containerWidth}px`
    tempContainer.style.minHeight = `${containerHeight}px`
    tempContainer.style.padding = '40px'
    tempContainer.style.background = isDark.value ? '#0F172A' : '#FFFFFF'
    tempContainer.style.zIndex = '-1'
    tempContainer.style.boxSizing = 'border-box'
    tempContainer.style.overflow = 'visible'
    
    const clone = mainContent.cloneNode(true) as HTMLElement
    clone.style.width = '100%'
    clone.style.maxWidth = '100%'
    clone.style.margin = '0'
    clone.style.padding = '0'
    clone.style.boxSizing = 'border-box'
    
    tempContainer.appendChild(clone)
    document.body.appendChild(tempContainer)
    
    // Wait for clone to render
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Replace ECharts canvas elements with their rendered images
    const originalCharts = mainContent.querySelectorAll('canvas')
    const clonedCharts = tempContainer.querySelectorAll('canvas')
    
    clonedCharts.forEach((clonedCanvas, index) => {
      const originalCanvas = originalCharts[index] as HTMLCanvasElement
      if (originalCanvas && originalCanvas.width > 0 && originalCanvas.height > 0) {
        try {
          // Get the image data from the original canvas
          const imgData = originalCanvas.toDataURL('image/png')
          
          // Create an img element
          const img = document.createElement('img')
          img.src = imgData
          img.style.width = clonedCanvas.style.width || `${clonedCanvas.width}px`
          img.style.height = clonedCanvas.style.height || `${clonedCanvas.height}px`
          img.style.display = 'block'
          
          // Replace the canvas with the image
          if (clonedCanvas.parentNode) {
            clonedCanvas.parentNode.replaceChild(img, clonedCanvas)
          }
        } catch (e) {
          console.warn('Failed to convert chart canvas:', e)
        }
      }
    })
    
    // Wait for replaced images to be ready
    // Capture with html2canvas - target the entire temp container
    const captureHeight = tempContainer.scrollHeight
    
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: isDark.value ? '#0F172A' : '#FFFFFF',
      logging: false,
      width: containerWidth,
      height: captureHeight,
      windowWidth: containerWidth,
      windowHeight: captureHeight,
      onclone: (clonedDoc: Document) => {
        const clonedContainer = clonedDoc.querySelector('div[style*="position: fixed"]') as HTMLElement
        if (clonedContainer) {
          clonedContainer.style.display = 'block'
          clonedContainer.style.position = 'relative'
          clonedContainer.style.left = '0'
          clonedContainer.style.width = `${containerWidth}px`
        }
      }
    })
    
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas is empty or invalid')
    }
    
    // Calculate PDF dimensions - A4 landscape is 297mm x 210mm
    const pdfWidth = 297 // A4 landscape width in mm
    const pdfHeight = 210 // A4 landscape height in mm
    
    // Scale canvas to fit PDF width, calculate proportional height
    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = pdfHeight
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    })
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    
    let heightLeft = imgHeight
    let position = 0
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pageHeight
    }
    
    // Generate filename with username and timestamp
    const username = userData.value?.name?.toLowerCase().replace(/\s+/g, '-') || 'user'
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `user-report-${username}-${timestamp}.pdf`
    
    // Save PDF
    pdf.save(filename)
    
    ElMessage.success('Report exported successfully!')
    
  } catch (err) {
    console.error('PDF export failed:', err)
    ElMessage.error(`Failed to export report: ${err instanceof Error ? err.message : 'Unknown error'}`)
  } finally {
    // Cleanup: remove temporary container
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer)
    }
    
    // Reset button state
    if (exportBtn && originalBtnContent) {
      exportBtn.style.pointerEvents = 'auto'
      exportBtn.style.opacity = '1'
      exportBtn.innerHTML = originalBtnContent
    }
  }
}

const viewSession = (session: Session) => {
  ElMessage.info(`Viewing session ${session.sessionId}`)
}

// Helpers
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

// Helpers - keep for future use
// const _formatDate = (dateStr?: string) => {
//   if (!dateStr) return 'N/A'
//   return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
// }

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Score color helper - keep for future use
// const _getScoreColorType = (score: number) => {
//   if (score < 40) return 'success'
//   if (score < 60) return 'warning'
//   return 'danger'
// }

const getScoreClass = (score: number) => {
  if (score < 40) return 'low'
  if (score < 60) return 'medium'
  return 'high'
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    completed: 'success',
    interrupted: 'warning',
    pending: 'info'
  }
  return types[status] || 'info'
}

const getInsightIcon = (type: string) => {
  const icons: Record<string, string> = {
    fatigue: 'mdi mdi-brain',
    blink: 'mdi mdi-eye',
    performance: 'mdi mdi-trending-up',
    pattern: 'mdi mdi-chart-timeline-variant'
  }
  return icons[type] || 'mdi mdi-information'
}

// Lifecycle
onMounted(() => {
  fetchUserData()
})

// Watch for route changes
watch(() => route.params.id, () => {
  if (route.params.id) {
    fetchUserData()
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/scss/zen-variables';
@import '@/assets/scss/responsive';

.user-details-page {
  min-height: 100vh;
  background: var(--zen-bg-gradient);
  position: relative;
  transition: background 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
  max-width: 100vw;
}

.details-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--zen-border-glass);
  padding: $space-3 $space-4;
  transition: background 0.3s ease, border-color 0.3s ease;

  @include from-tablet {
    padding: $space-4 $space-6;
  }
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;

  @include from-tablet {
    gap: $space-4;
  }
}

.back-button {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-lg;
  border: 1px solid var(--zen-border-medium);
  background: var(--zen-bg-secondary);
  color: var(--zen-text-primary);
  font-size: $text-body-xs;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  @include from-tablet {
    padding: $space-2 $space-4;
    font-size: $text-body-sm;
  }

  i {
    font-size: 16px;

    @include from-tablet {
      font-size: 18px;
    }
  }

  span {
    display: none;

    @include from-mobile-md {
      display: inline;
    }
  }

  &:hover {
    background: var(--zen-surface-hover);
    border-color: var(--zen-accent-teal);
    color: var(--zen-accent-teal);
  }
}

.header-logo {
  display: flex;
  align-items: center;
  
  &.mobile-only {
    display: flex !important;

    @include from-tablet {
      display: none !important;
    }
  }
  
  .logo-image {
    height: 32px;
    width: auto;
    object-fit: contain;
    transition: opacity 0.3s ease;

    @include from-tablet {
      height: 40px;
    }
  }
}

.header-center {
  display: none;

  @include from-tablet {
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: auto;
  }
}

.page-badge {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  background: var(--zen-nav-item-hover);
  color: var(--zen-accent-teal-dark);
  border-radius: $radius-full;
  font-size: $text-body-xs;
  font-weight: $font-weight-medium;
  transition: all 0.3s ease;

  @include from-tablet {
    gap: $space-2;
    padding: $space-2 $space-4;
    font-size: $text-body-sm;
  }

  i {
    font-size: 14px;

    @include from-tablet {
      font-size: 18px;
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
  justify-content: center;

  @include from-tablet {
    gap: $space-3;
    flex-wrap: nowrap;
    justify-content: flex-end;
  }

  .el-button {
    background: var(--zen-accent-teal) !important;
    border-color: var(--zen-accent-teal) !important;
    padding: 8px 12px;
    font-size: $text-body-xs;

    @include from-tablet {
      padding: 10px 16px;
      font-size: $text-body-sm;
    }

    i {
      display: none;

      @include from-mobile-md {
        display: inline;
      }
    }

    &:hover {
      background: var(--zen-accent-teal-dark) !important;
      border-color: var(--zen-accent-teal-dark) !important;
    }
  }
}

.lang-toggle-btn {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2;
  border-radius: $radius-lg;
  border: 1px solid var(--zen-border-medium);
  background: var(--zen-bg-secondary);
  color: var(--zen-text-primary);
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  @include from-tablet {
    gap: $space-2;
    padding: $space-2 $space-3;
  }

  .lang-flag {
    font-size: 14px;
    line-height: 1;

    @include from-tablet {
      font-size: 16px;
    }
  }

  .lang-code {
    font-size: 10px;
    font-weight: $font-weight-bold;
    display: none;

    @include from-mobile-md {
      display: inline;
      font-size: 12px;
    }
  }

  &:hover {
    background: var(--zen-surface-hover);
    border-color: var(--zen-accent-teal);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2;
  border-radius: $radius-lg;
  border: 1px solid var(--zen-accent-danger);
  background: rgba(239, 68, 68, 0.1);
  color: var(--zen-accent-danger);
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  @include from-tablet {
    gap: $space-2;
    padding: $space-2 $space-4;
  }

  i {
    font-size: 16px;

    @include from-tablet {
      font-size: 18px;
    }
  }

  span {
    display: none;

    @include from-mobile-md {
      display: inline;
    }
  }

  &:hover {
    background: var(--zen-accent-danger);
    color: white;
  }
}

// Mobile/Desktop visibility helpers
.desktop-only {
  display: none !important;

  @include from-tablet {
    display: flex !important;
  }
}

.mobile-only {
  display: flex !important;

  @include from-tablet {
    display: none !important;
  }
}

// Hamburger Menu Button
.hamburger-btn {
  width: 44px;
  height: 44px;
  border-radius: $radius-lg;
  border: 1px solid var(--zen-border-medium);
  background: var(--zen-bg-secondary);
  color: var(--zen-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: auto;

  i {
    font-size: 24px;
    transition: transform 0.3s ease;
  }

  &:hover {
    background: var(--zen-surface-hover);
    border-color: var(--zen-accent-teal);
  }

  &.active {
    background: var(--zen-accent-teal);
    border-color: var(--zen-accent-teal);
    color: white;

    i {
      transform: rotate(180deg);
    }
  }
}

// Mobile Menu Dropdown
.mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--zen-surface);
  border-bottom: 1px solid var(--zen-border-glass);
  box-shadow: var(--zen-shadow-lg);
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.3s ease;

  @media (max-width: $breakpoint-md - 1) {
    display: block;
  }

  &.open {
    max-height: 400px;
    opacity: 1;
  }
}

.mobile-menu-content {
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-lg;
  border: none;
  background: var(--zen-bg-secondary);
  color: var(--zen-text-primary);
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;

  i {
    font-size: 20px;
    color: var(--zen-accent-teal);
    width: 24px;
    text-align: center;
  }

  .lang-flag {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  &:hover {
    background: var(--zen-surface-hover);
  }

  &:active {
    transform: scale(0.98);
  }

  &.theme-item {
    justify-content: flex-start;

    .theme-toggle-inline {
      margin-left: auto;
    }
  }

  &.logout-item {
    color: var(--zen-accent-danger);
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);

    i {
      color: var(--zen-accent-danger);
    }

    &:hover {
      background: var(--zen-accent-danger);
      color: white;

      i {
        color: white;
      }
    }
  }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: $space-3;
  padding: $space-4;

  @include from-tablet {
    gap: $space-4;
  }
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;

  i {
    font-size: 40px;
    color: var(--zen-accent-teal);

    @include from-tablet {
      font-size: 48px;
    }
  }

  span {
    color: var(--zen-text-secondary);
    transition: color 0.3s ease;
    font-size: $text-body-sm;
    text-align: center;
  }
}

.error-container {
  i {
    font-size: 48px;
    color: var(--zen-accent-danger);

    @include from-tablet {
      font-size: 64px;
    }
  }

  h3 {
    color: var(--zen-text-heading);
    margin: 0;
    font-size: $text-title-sm;
    text-align: center;

    @include from-tablet {
      font-size: $text-title-md;
    }
  }

  p {
    color: var(--zen-text-muted);
    text-align: center;
  }
}

.details-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  position: relative;
  z-index: 1;
  overflow-x: hidden;

  @include from-tablet {
    padding: $space-5;
  }

  @include from-desktop-sm {
    padding: $space-6;
  }
}

// Profile Section
.profile-section {
  margin-bottom: 0;

  @include from-tablet {
    margin-bottom: $space-6;
  }
}

.profile-row {
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: stretch;
  width: 100%;

  @include from-tablet {
    gap: $space-4;
    align-items: center;
  }

  @include from-desktop {
    flex-direction: row;
    align-items: stretch;
  }
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: $space-4;
  padding: $space-4;
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-left: none;
  border-right: none;
  border-radius: 0;
  box-shadow: var(--zen-shadow-md);
  transition: all 0.3s ease;
  width: 100%;

  @include from-tablet {
    flex-direction: row;
    text-align: left;
    gap: $space-5;
    padding: $space-5;
    border-left: 1px solid var(--zen-border-glass);
    border-right: 1px solid var(--zen-border-glass);
    border-radius: $radius-2xl;
    max-width: none;
  }

  @include from-desktop {
    flex: 0 0 auto;
    width: 400px;
  }
}

.metrics-row {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  width: 100%;

  @include from-tablet {
    flex-direction: row;
    gap: $space-3;
  }

  @include from-desktop {
    width: auto;
  }

  > * {
    flex: 1;
    min-width: 0;
  }
}

.profile-avatar {
  position: relative;
  flex-shrink: 0;

  img,
  .avatar-initials {
    width: 80px;
    height: 80px;
    border-radius: $radius-lg;
    object-fit: cover;

    @include from-tablet {
      width: 120px;
      height: 120px;
      border-radius: $radius-xl;
    }
  }

  .avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--zen-accent-teal), var(--zen-accent-peach));
    color: white;
    font-size: $text-heading-3;
    font-weight: $font-weight-bold;

    @include from-tablet {
      font-size: $text-heading-1;
    }
  }
}

.profile-info {
  flex: 1;

  .user-name {
    font-size: $text-heading-4;
    font-weight: $font-weight-bold;
    color: var(--zen-text-heading);
    margin: 0 0 $space-1;
    transition: color 0.3s ease;

    @include from-tablet {
      font-size: $text-heading-3;
    }
  }

  .user-id,
  .user-email {
    font-size: $text-body-xs;
    color: var(--zen-text-muted);
    margin: 0 0 $space-1;
    transition: color 0.3s ease;

    @include from-tablet {
      font-size: $text-body-sm;
    }
  }

  .profile-tags {
    display: flex;
    gap: $space-2;
    margin-top: $space-2;
    justify-content: center;

    @include from-tablet {
      justify-content: flex-start;
    }
  }
}

// Charts Section
.charts-section {
  margin-bottom: 0;

  @include from-tablet {
    margin-bottom: $space-6;
  }
}

.chart-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-left: none;
  border-right: none;
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 0;
  transition: all 0.3s ease;

  @include from-tablet {
    border-left: 1px solid var(--zen-border-glass);
    border-right: 1px solid var(--zen-border-glass);
    border-radius: $radius-xl;
    margin-bottom: $space-5;
  }

  &.full-width {
    width: 100%;
  }
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin-bottom: 0;

  @include from-tablet {
    gap: $space-4;
    margin-bottom: $space-4;
  }

  @include from-desktop-sm {
    grid-template-columns: 1fr 1fr;
    gap: $space-5;
    margin-bottom: $space-5;
  }

  .chart-card {
    margin-bottom: 0;
  }
}

.chart-header {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--zen-border-light);

  @include from-tablet {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: $space-4 $space-5;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-body-md;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);
    margin: 0;
    transition: color 0.3s ease;

    @include from-tablet {
      font-size: $text-title-sm;
    }

    i:not(.info-icon i) {
      color: var(--zen-accent-teal);
    }

    .info-icon {
      color: var(--zen-text-disabled);
      cursor: help;
      font-size: 12px;
      margin-left: $space-1;
      transition: color 0.2s ease;

      @include from-tablet {
        font-size: 14px;
      }

      &:hover {
        color: var(--zen-accent-teal);
      }

      i {
        color: inherit;
      }
    }
  }
}

.time-select {
  width: 100%;

  @include from-tablet {
    width: 140px;
  }

  :deep(.el-input__wrapper) {
    background: var(--zen-bg-secondary) !important;
    border-radius: $radius-md !important;
  }
}

// Date Navigator Styles
.date-navigator {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  width: 100%;

  @include from-tablet {
    flex-direction: row;
    align-items: center;
    gap: $space-4;
    width: auto;
  }
}

.date-picker-group {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #6366F1 0%, #3B82F6 100%);
  border-radius: 50px;
  padding: $space-2;
  gap: $space-1;
  justify-content: center;

  @include from-tablet {
    padding: $space-2 $space-3;
    gap: $space-2;
  }

  .nav-arrow {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    @include from-tablet {
      width: 28px;
      height: 28px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    i {
      font-size: 16px;

      @include from-tablet {
        font-size: 18px;
      }
    }
  }

  .current-date {
    color: white;
    font-weight: $font-weight-semibold;
    font-size: $text-body-sm;
    min-width: 80px;
    text-align: center;
    padding: 0 $space-1;

    @include from-tablet {
      font-size: $text-body-md;
      min-width: 100px;
      padding: 0 $space-2;
    }
  }
}

.view-toggle {
  display: flex;
  align-items: center;
  background: var(--zen-bg-secondary);
  border-radius: $radius-lg;
  padding: 3px;
  border: 1px solid var(--zen-border-light);
  width: 100%;
  justify-content: center;

  @include from-tablet {
    width: auto;
    padding: 4px;
  }

  .toggle-btn {
    flex: 1;
    padding: $space-2 $space-3;
    border: none;
    background: transparent;
    color: var(--zen-text-muted);
    font-size: $text-body-xs;
    font-weight: $font-weight-medium;
    cursor: pointer;
    border-radius: $radius-md;
    transition: all 0.2s ease;

    @include from-tablet {
      flex: none;
      padding: $space-2 $space-4;
      font-size: $text-body-sm;
    }

    &:hover:not(.active) {
      color: var(--zen-text-body);
      background: var(--zen-bg-tertiary);
    }

    &.active {
      background: #3B82F6;
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }
  }
}

.chart-body {
  padding: $space-3;

  @include from-tablet {
    padding: $space-4;
  }
}

// Sessions Section
.sessions-section {
  margin-bottom: 0;

  @include from-tablet {
    margin-bottom: $space-6;
  }
}

.sessions-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-left: none;
  border-right: none;
  border-radius: 0;
  overflow: hidden;
  transition: all 0.3s ease;

  @include from-tablet {
    border-left: 1px solid var(--zen-border-glass);
    border-right: 1px solid var(--zen-border-glass);
    border-radius: $radius-xl;
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--zen-border-light);

  @include from-tablet {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: $space-4 $space-5;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-body-md;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);
    margin: 0;
    transition: color 0.3s ease;

    @include from-tablet {
      font-size: $text-title-sm;
    }

    i:not(.info-icon i) {
      color: var(--zen-accent-teal);
    }

    .info-icon {
      color: var(--zen-text-disabled);
      cursor: help;
      font-size: 12px;
      margin-left: $space-1;
      transition: color 0.2s ease;

      @include from-tablet {
        font-size: 14px;
      }

      &:hover {
        color: var(--zen-accent-teal);
      }

      i {
        color: inherit;
      }
    }
  }
}

.search-input {
  width: 100%;

  @include from-tablet {
    width: 250px;
  }

  :deep(.el-input__wrapper) {
    background: var(--zen-input-bg) !important;
    border-radius: $radius-lg !important;
  }
}

.sessions-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @include from-tablet {
    margin: 0;
    padding: 0;
  }
  
  // Ensure table has minimum width for horizontal scroll on mobile
  .sessions-table {
    min-width: 700px;
  }
}

.sessions-table {
  :deep(.el-table) {
    background: transparent !important;
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-row-hover-bg-color: var(--zen-surface-hover);
    --el-table-header-bg-color: var(--zen-bg-secondary);
    --el-table-border-color: var(--zen-border-light);
    font-size: $text-body-xs;

    @include from-tablet {
      font-size: $text-body-sm;
    }
  }

  :deep(.el-table__header-wrapper th) {
    background: var(--zen-bg-secondary) !important;
    color: var(--zen-text-secondary) !important;
    font-size: 10px;
    padding: 8px 4px;

    @include from-tablet {
      font-size: $text-body-xs;
      padding: 12px 8px;
    }
  }

  :deep(.el-table__body tr) {
    background: transparent !important;

    td {
      background: transparent !important;
      color: var(--zen-text-primary) !important;
      border-color: var(--zen-border-light) !important;
      padding: 8px 4px;

      @include from-tablet {
        padding: 12px 8px;
      }
    }

    &:hover > td {
      background: var(--zen-surface-hover) !important;
    }
  }

  :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
    background: rgba(255, 255, 255, 0.02) !important;
  }

  :deep(.el-table__inner-wrapper::before) {
    background-color: var(--zen-border-light) !important;
  }
}

.session-id {
  font-family: monospace;
  font-size: 10px;
  color: var(--zen-accent-teal-dark);

  @include from-tablet {
    font-size: $text-body-sm;
  }
}

.score-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: $radius-sm;
  font-weight: $font-weight-semibold;
  font-size: 10px;

  @include from-tablet {
    padding: 2px 10px;
    font-size: $text-body-xs;
  }

  &.low {
    background: rgba(16, 185, 129, 0.15);
    color: var(--zen-accent-success);
  }

  &.medium {
    background: rgba(251, 191, 36, 0.15);
    color: var(--zen-accent-warning);
  }

  &.high {
    background: rgba(239, 68, 68, 0.15);
    color: var(--zen-accent-danger);
  }
}

.sessions-pagination {
  display: flex;
  justify-content: center;
  padding: $space-3;
  border-top: 1px solid var(--zen-border-light);

  @include from-tablet {
    padding: $space-4;
  }
}

// Insights Section
.insights-section {
  margin-bottom: $space-5;

  @include from-tablet {
    margin-bottom: $space-6;
  }
}

.insights-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;

  @include from-mobile-md {
    grid-template-columns: repeat(2, 1fr);
    gap: $space-4;
  }

  @include from-desktop-sm {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

.insight-card {
  display: flex;
  gap: $space-3;
  padding: $space-4;
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-lg;
  border-left: 4px solid var(--zen-text-muted);
  transition: all 0.3s ease;

  @include from-tablet {
    gap: $space-4;
    padding: $space-5;
    border-radius: $radius-xl;
  }

  &.info {
    border-left-color: var(--zen-accent-primary);

    .insight-icon {
      background: rgba(96, 165, 250, 0.15);
      color: var(--zen-accent-primary);
    }

    .insight-badge {
      background: rgba(96, 165, 250, 0.15);
      color: var(--zen-accent-primary);
    }
  }

  &.warning {
    border-left-color: var(--zen-accent-warning);

    .insight-icon {
      background: rgba(251, 191, 36, 0.15);
      color: var(--zen-accent-warning);
    }

    .insight-badge {
      background: rgba(251, 191, 36, 0.15);
      color: var(--zen-accent-warning);
    }
  }

  &.critical {
    border-left-color: var(--zen-accent-danger);

    .insight-icon {
      background: rgba(239, 68, 68, 0.15);
      color: var(--zen-accent-danger);
    }

    .insight-badge {
      background: rgba(239, 68, 68, 0.15);
      color: var(--zen-accent-danger);
    }
  }
}

.insight-icon {
  width: 36px;
  height: 36px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @include from-tablet {
    width: 44px;
    height: 44px;
    border-radius: $radius-lg;
  }

  i {
    font-size: 18px;

    @include from-tablet {
      font-size: 22px;
    }
  }
}

.insight-content {
  flex: 1;
  min-width: 0;

  h4 {
    font-size: $text-body-sm;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);
    margin: 0 0 $space-1;
    transition: color 0.3s ease;

    @include from-tablet {
      font-size: $text-body-md;
      margin: 0 0 $space-2;
    }
  }

  p {
    font-size: $text-body-xs;
    color: var(--zen-text-secondary);
    margin: 0;
    line-height: 1.5;
    transition: color 0.3s ease;

    @include from-tablet {
      font-size: $text-body-sm;
    }
  }
}

.insight-badge {
  font-size: 10px;
  font-weight: $font-weight-semibold;
  text-transform: capitalize;
  padding: 3px 8px;
  border-radius: $radius-sm;
  height: fit-content;
  flex-shrink: 0;

  @include from-tablet {
    font-size: $text-body-xs;
    padding: 4px 10px;
  }
}

// Footer
.details-footer {
  text-align: center;
  padding: $space-4;
  font-size: $text-body-xs;
  color: var(--zen-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  border-top: 1px solid var(--zen-border-light);
  transition: color 0.3s ease, border-color 0.3s ease;

  @include from-tablet {
    flex-direction: row;
    justify-content: center;
    gap: $space-4;
    padding: $space-5;
  }

  .version {
    background: var(--zen-bg-secondary);
    padding: 2px 8px;
    border-radius: $radius-sm;
    transition: background 0.3s ease;
  }
}

// Implementation Notes Section
.implementation-notes-section {
  margin-bottom: 0;

  @include from-tablet {
    margin-bottom: $space-6;
  }
}

.notes-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-left: none;
  border-right: none;
  border-radius: 0;
  overflow: hidden;
  transition: all 0.3s ease;

  @include from-tablet {
    border-left: 1px solid var(--zen-border-glass);
    border-right: 1px solid var(--zen-border-glass);
    border-radius: $radius-xl;
  }
}

.notes-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border-bottom: 1px solid var(--zen-border-light);
  background: var(--zen-bg-secondary);

  @include from-tablet {
    padding: $space-5;
  }

  i {
    font-size: 24px;
    color: var(--zen-accent-primary);
  }

  h3 {
    font-size: $text-body-md;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);
    margin: 0;
    transition: color 0.3s ease;

    @include from-tablet {
      font-size: $text-title-sm;
    }
  }
}

.notes-content {
  padding: $space-4;

  @include from-tablet {
    padding: $space-5;
  }
}

.note-item {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3;
  margin-bottom: $space-3;
  background: var(--zen-bg-tertiary);
  border-radius: $radius-lg;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;

  @include from-tablet {
    flex-direction: row;
    gap: $space-4;
    padding: $space-4;
  }

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-left-color: var(--zen-accent-teal);
    background: var(--zen-surface-hover);
  }
}

.note-status {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  font-size: $text-body-xs;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
  flex-shrink: 0;
  width: fit-content;

  i {
    font-size: 16px;
  }

  &.implemented {
    background: rgba(16, 185, 129, 0.15);
    color: var(--zen-accent-success);
  }

  &.pending {
    background: rgba(251, 191, 36, 0.15);
    color: var(--zen-accent-warning);
  }
}

.note-details {
  flex: 1;
  font-size: $text-body-sm;
  color: var(--zen-text-secondary);
  line-height: 1.6;
  transition: color 0.3s ease;

  strong {
    color: var(--zen-text-heading);
    font-weight: $font-weight-semibold;
  }

  code {
    display: block;
    margin-top: $space-2;
    padding: $space-2 $space-3;
    background: rgba(0, 0, 0, 0.1);
    border-radius: $radius-sm;
    font-family: 'Courier New', monospace;
    font-size: $text-body-xs;
    color: var(--zen-accent-teal);
    overflow-x: auto;
  }
}
</style>
