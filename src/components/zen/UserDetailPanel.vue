<template>
  <div class="user-detail-panel" :class="{ 'dark-mode': isDark }">
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
            <!-- Action Buttons -->
            <div class="profile-actions">
              <button class="edit-panel-btn" @click="openEditModal" title="Edit Member">
                <i class="mdi mdi-pencil"></i>
              </button>
              <button class="export-panel-btn" @click="exportReport" title="Export Report">
                <i class="mdi mdi-download"></i>
              </button>
              <button class="close-panel-btn" @click="$emit('close')" title="Close">
                <i class="mdi mdi-close"></i>
              </button>
            </div>
            
            <div class="profile-avatar">
              <img v-if="userData.avatar" :src="userData.avatar" :alt="userData.name" />
              <span v-else class="avatar-initials">{{ getInitials(userData.name) }}</span>
            </div>
            <div class="profile-info">
              <h1 class="user-name">{{ userData.name }}</h1>
              <p class="user-id">PIN: {{ userData.pin }}</p>
              <div class="profile-tags">
                <el-tag size="small" v-if="userData.role">{{ userData.role }}</el-tag>
                <el-tag size="small" type="info">{{ userData.sessionCount || 0 }} Sessions</el-tag>
              </div>
              <!-- User Tags Section -->
              <div class="user-tags-section">
                <TagSelector 
                  v-if="canEditTags"
                  :user-id="parseInt(userId)" 
                  :model-value="userData.tags || []"
                  :readonly="false"
                  @tags-updated="handleTagsUpdated"
                />
                <div v-else-if="userData.tags && userData.tags.length > 0" class="tags-display">
                  <TagBadge
                    v-for="tag in userData.tags"
                    :key="tag.id"
                    :tag="tag"
                    :removable="false"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Performance Metrics Cards -->
          <div class="metrics-row">
            <FatigueScoreCard
              :score="userData.latestScore"
              :is-dark="isDark"
              :latest-date="userData.latestScoreDate"
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
                >Day</button>
                <button 
                  :class="['toggle-btn', { active: fatigueViewMode === 'week' }]" 
                  @click="fatigueViewMode = 'week'"
                >Week</button>
                <button 
                  :class="['toggle-btn', { active: fatigueViewMode === 'month' }]" 
                  @click="fatigueViewMode = 'month'"
                >Month</button>
              </div>
            </div>
          </div>
          <div class="chart-body">
            <ChartCard :option="fatigueTimelineOption" :style="{ height: '350px' }" />
          </div>
        </div>

        <!-- Load More Button -->
        <div v-if="!showMoreContent" class="load-more-section">
          <button 
            class="load-more-btn" 
            @click="loadMoreContent"
            :disabled="loadingMoreContent"
          >
            <i v-if="loadingMoreContent" class="mdi mdi-loading mdi-spin"></i>
            <i v-else class="mdi mdi-chevron-down"></i>
            {{ loadingMoreContent ? 'Loading...' : 'Load More Details' }}
          </button>
        </div>

        <!-- Additional Charts (Lazy Loaded) -->
        <template v-if="showMoreContent">
        <!-- Blink Duration Analysis - Full Width -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>
              <i class="mdi mdi-eye"></i>
              Blink Duration Analysis
            </h3>
            <div class="date-navigator">
              <div class="date-picker-group">
                <button class="nav-arrow" @click="navigateBlinkDate(-1)">
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="current-date">{{ formattedBlinkDate }}</span>
                <button class="nav-arrow" @click="navigateBlinkDate(1)">
                  <i class="mdi mdi-chevron-right"></i>
                </button>
              </div>
              <div class="view-toggle">
                <button 
                  :class="['toggle-btn', { active: blinkViewMode === 'day' }]"
                  @click="blinkViewMode = 'day'"
                >Day</button>
                <button 
                  :class="['toggle-btn', { active: blinkViewMode === 'week' }]"
                  @click="blinkViewMode = 'week'"
                >Week</button>
                <button 
                  :class="['toggle-btn', { active: blinkViewMode === 'month' }]"
                  @click="blinkViewMode = 'month'"
                >Month</button>
              </div>
            </div>
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
            </h3>
            <div class="date-navigator">
              <div class="date-picker-group">
                <button class="nav-arrow" @click="navigatePupilDate(-1)">
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="current-date">{{ formattedPupilDate }}</span>
                <button class="nav-arrow" @click="navigatePupilDate(1)">
                  <i class="mdi mdi-chevron-right"></i>
                </button>
              </div>
              <div class="view-toggle">
                <button 
                  :class="['toggle-btn', { active: pupilViewMode === 'day' }]" 
                  @click="pupilViewMode = 'day'"
                >Day</button>
                <button 
                  :class="['toggle-btn', { active: pupilViewMode === 'week' }]" 
                  @click="pupilViewMode = 'week'"
                >Week</button>
                <button 
                  :class="['toggle-btn', { active: pupilViewMode === 'month' }]" 
                  @click="pupilViewMode = 'month'"
                >Month</button>
              </div>
            </div>
          </div>
          <div class="chart-body pupil-chart">
            <ChartCard :option="pupilSizeOption" :style="{ height: '380px' }" />
          </div>
        </div>
        </template>
      </section>

      <!-- Session History Section (Lazy Loaded) -->
      <section v-if="showMoreContent" class="sessions-section">
        <div class="sessions-card">
          <div class="card-header">
            <h3>
              <i class="mdi mdi-history"></i>
              Session History
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
              :data="paginatedSessions"
              stripe
              :empty-text="sessionSearch ? 'No sessions found' : 'No session history'"
              class="sessions-table"
            >
              <el-table-column prop="sessionId" label="Session ID" min-width="100">
                <template #default="{ row }">
                  <el-tooltip 
                    :content="row.sessionId" 
                    placement="top" 
                    :show-after="300"
                  >
                    <span class="session-id truncated">{{ row.sessionId?.slice(0, 4) }}...</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="date" label="Date" min-width="130" sortable>
                <template #default="{ row }">
                  {{ formatDateTime(row.date) }}
                </template>
              </el-table-column>
              <el-table-column prop="fatigueScore" label="Fatigue Score" width="120" align="center" sortable>
                <template #default="{ row }">
                  <span class="score-badge" :class="getScoreClass(row.fatigueScore)">
                    {{ row.fatigueScore }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="Pupil (mm)" width="110" align="center">
                <template #default="{ row }">
                  <el-tooltip 
                    :content="`L: ${row.leftPupilSize?.toFixed(2) || '0.00'} / R: ${row.rightPupilSize?.toFixed(2) || '0.00'}`" 
                    placement="top"
                  >
                    <span class="metric-value pupil">
                      {{ getAvgPupil(row) }}
                    </span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="Blink (ms)" width="110" align="center">
                <template #default="{ row }">
                  <el-tooltip 
                    :content="`L: ${row.leftBlinkDuration?.toFixed(0) || '0'} / R: ${row.rightBlinkDuration?.toFixed(0) || '0'}`" 
                    placement="top"
                  >
                    <span class="metric-value blink">
                      {{ getAvgBlink(row) }}
                    </span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="Status" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="90" align="center" fixed="right">
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

      <!-- Insights Section (Lazy Loaded) -->
      <section class="insights-section" v-if="showMoreContent && userData.insights && userData.insights.length > 0">
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
    </main>

    <!-- Edit Member Modal -->
    <EditMemberModal
      v-model="showEditModal"
      :member="memberForEdit"
      @update-member="handleUpdateMember"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { useSuperadminStore } from '@/stores/superadmin'
import { usePoolAdminStore } from '@/stores/poolAdmin'
import { getUser, listScores, listStorageAvg } from '@/lib/api'
import type { EChartsOption } from 'echarts'
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth
} from 'date-fns'

// Components
import ChartCard from './ChartCard.vue'
import FatigueScoreCard from './FatigueScoreCard.vue'
import AverageScoreCard from './AverageScoreCard.vue'
import StandardDeviationCard from './StandardDeviationCard.vue'
import TagSelector from './TagSelector.vue'
import TagBadge from './TagBadge.vue'
import EditMemberModal from './EditMemberModal.vue'

interface Props {
  userId: string
  isAdmin?: boolean
  isSuperadmin?: boolean
  isPoolAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
  isSuperadmin: false,
  isPoolAdmin: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'tags-updated'): void
  (e: 'member-updated', data: { id: string; username: string; avatar: File | null; avatarUrl: string | null }): void
}>()

const { isDark } = useTheme()
const authStore = useAuthStore()
const superadminStore = useSuperadminStore()
const poolAdminStore = usePoolAdminStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const userData = ref<any>(null)
const allScoresData = ref<any[]>([])
const sessionSearch = ref('')
const currentSessionPage = ref(1)
const sessionsPerPage = 10

// Edit modal state
const showEditModal = ref(false)

const openEditModal = () => {
  showEditModal.value = true
}

// Member object for EditMemberModal
const memberForEdit = computed(() => ({
  id: props.userId,
  name: userData.value?.name || '',
  avatarUrl: userData.value?.avatar || null,
  pin: userData.value?.pin || ''
}))

const handleUpdateMember = async (memberData: { id: string; username: string; avatar: File | null; avatarUrl: string | null }) => {
  // Emit to parent first - parent will handle API calls
  emit('member-updated', memberData)
}

// Method to refresh data (can be called by parent after API update)
const refreshData = async () => {
  await fetchUserData()
}

// Expose refresh method to parent
defineExpose({ refreshData })

// View mode states
const fatigueViewMode = ref<'day' | 'week' | 'month'>('month')
const fatigueSelectedDate = ref(new Date())
const blinkViewMode = ref<'day' | 'week' | 'month'>('month')
const blinkSelectedDate = ref(new Date())
const pupilViewMode = ref<'day' | 'week' | 'month'>('month')
const pupilSelectedDate = ref(new Date())

// Lazy loading state for additional content
const showMoreContent = ref(false)
const loadingMoreContent = ref(false)
const storageDataLoaded = ref(false)

const loadMoreContent = async () => {
  loadingMoreContent.value = true
  
  try {
    // Fetch storage avg data if not already loaded
    if (!storageDataLoaded.value) {
      await fetchStorageAvgData()
    }
    showMoreContent.value = true
  } catch (err) {
    console.error('Error loading more content:', err)
  } finally {
    loadingMoreContent.value = false
  }
}

// Fetch storage average data for blink/pupil charts
async function fetchStorageAvgData() {
  if (!props.userId) return
  
  try {
    const currentUserId = parseInt(props.userId)
    let storageAverages: any[] = []
    
    // Use pool admin API if in pool admin mode
    if (props.isPoolAdmin || poolAdminStore.isAuthenticated) {
      storageAverages = await poolAdminStore.fetchUserStorageAvg(currentUserId)
    } else {
      let tenantId: number
      if (superadminStore.isAuthenticated && superadminStore.selectedDeviceId) {
        tenantId = superadminStore.selectedDeviceId
      } else {
        tenantId = parseInt(authStore.user?.tenant_id || '1')
      }
      
      storageAverages = await listStorageAvg(tenantId, currentUserId)
    }
    
    // Create storage avg map
    const storageAvgMap = new Map(storageAverages.map(avg => [avg.key, avg]))
    
    // Merge with existing scores data
    allScoresData.value = allScoresData.value.map((score: any) => {
      const storageAvg = storageAvgMap.get(score.key)
      return {
        ...score,
        leftPupilSize: storageAvg?.leftPupilSize || 0,
        rightPupilSize: storageAvg?.rightPupilSize || 0,
        leftBlinkDuration: storageAvg?.leftBlinkDuration || 0,
        rightBlinkDuration: storageAvg?.rightBlinkDuration || 0,
        leftMA: storageAvg?.leftMA || 0,
        rightMA: storageAvg?.rightMA || 0
      }
    })
    
    // Also update sessions in userData with the new blink/pupil data
    if (userData.value?.sessions) {
      userData.value.sessions = userData.value.sessions.map((session: any) => {
        const scoreData = allScoresData.value.find((s: any) => s.key === session.sessionId)
        if (scoreData) {
          return {
            ...session,
            leftPupilSize: scoreData.leftPupilSize || 0,
            rightPupilSize: scoreData.rightPupilSize || 0,
            leftBlinkDuration: scoreData.leftBlinkDuration || 0,
            rightBlinkDuration: scoreData.rightBlinkDuration || 0
          }
        }
        return session
      })
    }
    
    storageDataLoaded.value = true
  } catch (err) {
    console.error('Error fetching storage avg data:', err)
    throw err
  }
}

// Formatted dates
const formattedFatigueDate = computed(() => {
  const date = fatigueSelectedDate.value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (fatigueViewMode.value === 'day') {
    return `${year}/${month}/${day}`
  } else if (fatigueViewMode.value === 'week') {
    const startOfWeekDate = new Date(date)
    startOfWeekDate.setDate(date.getDate() - date.getDay())
    const endOfWeekDate = new Date(startOfWeekDate)
    endOfWeekDate.setDate(startOfWeekDate.getDate() + 6)
    return `${year}/${startOfWeekDate.getMonth() + 1}/${startOfWeekDate.getDate()} - ${endOfWeekDate.getMonth() + 1}/${endOfWeekDate.getDate()}`
  } else {
    return `${year}/${month}`
  }
})

const formattedBlinkDate = computed(() => {
  const date = blinkSelectedDate.value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (blinkViewMode.value === 'day') {
    return `${year}/${month}/${day}`
  } else if (blinkViewMode.value === 'week') {
    const startOfWeekDate = new Date(date)
    startOfWeekDate.setDate(date.getDate() - date.getDay())
    const endOfWeekDate = new Date(startOfWeekDate)
    endOfWeekDate.setDate(startOfWeekDate.getDate() + 6)
    return `${year}/${startOfWeekDate.getMonth() + 1}/${startOfWeekDate.getDate()} - ${endOfWeekDate.getMonth() + 1}/${endOfWeekDate.getDate()}`
  } else {
    return `${year}/${month}`
  }
})

const formattedPupilDate = computed(() => {
  const date = pupilSelectedDate.value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (pupilViewMode.value === 'day') {
    return `${year}/${month}/${day}`
  } else if (pupilViewMode.value === 'week') {
    const startOfWeekDate = new Date(date)
    startOfWeekDate.setDate(date.getDate() - date.getDay())
    const endOfWeekDate = new Date(startOfWeekDate)
    endOfWeekDate.setDate(startOfWeekDate.getDate() + 6)
    return `${year}/${startOfWeekDate.getMonth() + 1}/${startOfWeekDate.getDate()} - ${endOfWeekDate.getMonth() + 1}/${endOfWeekDate.getDate()}`
  } else {
    return `${year}/${month}`
  }
})

// Navigate date functions
function navigateFatigueDate(direction: number) {
  const date = new Date(fatigueSelectedDate.value)
  if (fatigueViewMode.value === 'day') date.setDate(date.getDate() + direction)
  else if (fatigueViewMode.value === 'week') date.setDate(date.getDate() + (direction * 7))
  else date.setMonth(date.getMonth() + direction)
  fatigueSelectedDate.value = date
}

function navigateBlinkDate(direction: number) {
  const date = new Date(blinkSelectedDate.value)
  if (blinkViewMode.value === 'day') date.setDate(date.getDate() + direction)
  else if (blinkViewMode.value === 'week') date.setDate(date.getDate() + (direction * 7))
  else date.setMonth(date.getMonth() + direction)
  blinkSelectedDate.value = date
}

function navigatePupilDate(direction: number) {
  const date = new Date(pupilSelectedDate.value)
  if (pupilViewMode.value === 'day') date.setDate(date.getDate() + direction)
  else if (pupilViewMode.value === 'week') date.setDate(date.getDate() + (direction * 7))
  else date.setMonth(date.getMonth() + direction)
  pupilSelectedDate.value = date
}

// Helper functions
function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getScoreClass(score: number) {
  if (score < 40) return 'low'
  if (score < 60) return 'medium'
  return 'high'
}

function getStatusType(status: string) {
  const types: Record<string, any> = {
    completed: 'success',
    interrupted: 'warning',
    pending: 'info'
  }
  return types[status] || 'info'
}

// Get average pupil size (L+R / 2)
function getAvgPupil(row: any) {
  const left = row.leftPupilSize || 0
  const right = row.rightPupilSize || 0
  if (left === 0 && right === 0) return '-'
  const avg = (left + right) / 2
  return avg.toFixed(2)
}

// Get average blink duration (L+R / 2)
function getAvgBlink(row: any) {
  const left = row.leftBlinkDuration || 0
  const right = row.rightBlinkDuration || 0
  if (left === 0 && right === 0) return '-'
  const avg = (left + right) / 2
  return Math.round(avg)
}

// View session details - placeholder for future implementation
function viewSession(session: any) {
  console.log('View session:', session)
  // TODO: Implement session detail view
}

function getInsightIcon(type: string) {
  const icons: Record<string, string> = {
    fatigue: 'mdi mdi-brain',
    blink: 'mdi mdi-eye',
    performance: 'mdi mdi-trending-up',
    pattern: 'mdi mdi-chart-timeline-variant'
  }
  return icons[type] || 'mdi mdi-information'
}

// Filter data by date range
function filterDataByDateRange(data: any[], date: Date, mode: string) {
  if (!data || data.length === 0) return []
  
  let startDate: Date, endDate: Date
  
  if (mode === 'day') {
    startDate = startOfDay(date)
    endDate = endOfDay(date)
  } else if (mode === 'week') {
    startDate = startOfWeek(date, { weekStartsOn: 0 })
    endDate = endOfWeek(date, { weekStartsOn: 0 })
  } else {
    startDate = startOfMonth(date)
    endDate = endOfMonth(date)
  }
  
  return data.filter(item => {
    const itemDate = new Date(item.created_at || item.sessionDate)
    if (isNaN(itemDate.getTime())) return false
    return itemDate >= startDate && itemDate <= endDate
  }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

// Filtered fatigue data
const filteredFatigueData = computed(() => {
  const filtered = filterDataByDateRange(allScoresData.value, fatigueSelectedDate.value, fatigueViewMode.value)
  
  if (fatigueViewMode.value === 'day') {
    return filtered.map(item => ({
      date: format(new Date(item.created_at), 'HH:mm'),
      score: Number(item.score || 0)
    }))
  } else if (fatigueViewMode.value === 'week') {
    const dayMap = new Map()
    filtered.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'MM/dd')
      if (!dayMap.has(dateKey)) dayMap.set(dateKey, { sum: 0, count: 0 })
      const rec = dayMap.get(dateKey)
      rec.sum += Number(item.score || 0)
      rec.count += 1
    })
    
    const result = []
    const start = startOfWeek(fatigueSelectedDate.value, { weekStartsOn: 0 })
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
    const dayMap = new Map()
    filtered.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'MM/dd')
      if (!dayMap.has(dateKey)) dayMap.set(dateKey, { sum: 0, count: 0 })
      const rec = dayMap.get(dateKey)
      rec.sum += Number(item.score || 0)
      rec.count += 1
    })
    
    const datesWithData = Array.from(dayMap.keys()).sort()
    if (datesWithData.length > 0) {
      return datesWithData.map(dateKey => {
        const rec = dayMap.get(dateKey)
        return { date: dateKey, score: Math.round(rec.sum / rec.count) }
      })
    }
    return []
  }
})

// Filtered blink data
const filteredBlinkData = computed(() => {
  const filtered = filterDataByDateRange(allScoresData.value, blinkSelectedDate.value, blinkViewMode.value)
  
  if (blinkViewMode.value === 'day') {
    return filtered.map(item => ({
      time: format(new Date(item.created_at), 'HH:mm'),
      leftBlinks: item.leftBlinkDuration || 0,
      rightBlinks: item.rightBlinkDuration || 0
    }))
  } else {
    const dayMap = new Map()
    filtered.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'MM/dd')
      if (!dayMap.has(dateKey)) dayMap.set(dateKey, { leftSum: 0, rightSum: 0, count: 0 })
      const rec = dayMap.get(dateKey)
      rec.leftSum += item.leftBlinkDuration || 0
      rec.rightSum += item.rightBlinkDuration || 0
      rec.count += 1
    })
    
    return Array.from(dayMap.entries()).map(([dateKey, rec]: [string, any]) => ({
      time: dateKey,
      leftBlinks: Math.round(rec.leftSum / rec.count),
      rightBlinks: Math.round(rec.rightSum / rec.count)
    }))
  }
})

// Filtered pupil data
const filteredPupilData = computed(() => {
  const filtered = filterDataByDateRange(allScoresData.value, pupilSelectedDate.value, pupilViewMode.value)
  
  if (pupilViewMode.value === 'day') {
    return filtered.map(item => ({
      time: format(new Date(item.created_at), 'HH:mm'),
      leftPupil: item.leftPupilSize || 0,
      rightPupil: item.rightPupilSize || 0
    }))
  } else {
    const dayMap = new Map()
    filtered.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'MM/dd')
      if (!dayMap.has(dateKey)) dayMap.set(dateKey, { leftSum: 0, rightSum: 0, count: 0 })
      const rec = dayMap.get(dateKey)
      rec.leftSum += item.leftPupilSize || 0
      rec.rightSum += item.rightPupilSize || 0
      rec.count += 1
    })
    
    return Array.from(dayMap.entries()).map(([dateKey, rec]: [string, any]) => ({
      time: dateKey,
      leftPupil: Math.round((rec.leftSum / rec.count) * 100) / 100,
      rightPupil: Math.round((rec.rightSum / rec.count) * 100) / 100
    }))
  }
})

// Sessions
const filteredSessions = computed(() => {
  if (!userData.value?.sessions) return []
  const search = sessionSearch.value.toLowerCase()
  return userData.value.sessions.filter((s: any) => 
    !search || s.sessionId?.toLowerCase().includes(search) || s.date?.toLowerCase().includes(search)
  )
})

const paginatedSessions = computed(() => {
  const start = (currentSessionPage.value - 1) * sessionsPerPage
  return filteredSessions.value.slice(start, start + sessionsPerPage)
})

const totalSessionPages = computed(() => Math.ceil(filteredSessions.value.length / sessionsPerPage))

// Tag editing permission
const canEditTags = computed(() => props.isAdmin || props.isSuperadmin)

// Handle tags updated - only refresh user profile (tags), not scores
const handleTagsUpdated = async () => {
  // Only refresh user profile to get updated tags, not scores
  // This avoids unnecessary API calls and improves UX
  try {
    const currentUserId = parseInt(props.userId)
    const updatedUser = await getUser(currentUserId)
    
    // Update only the user profile data, keep existing scores
    userData.value = {
      ...userData.value,
      name: updatedUser.name || userData.value?.name,
      uniform_number: updatedUser.uniform_number || userData.value?.uniform_number,
      portrait_image: updatedUser.portrait_image || userData.value?.portrait_image,
      tags: updatedUser.tags || []
    }
  } catch (err) {
    console.error('Error refreshing user tags:', err)
  }
  
  emit('tags-updated')
}

// Variability trend data - get the 10 most recent scores
// Note: allScoresData is sorted DESC (newest first), so slice(0, 10) gets latest
const variabilityTrendData = computed(() => {
  if (allScoresData.value.length === 0) return [65, 72, 68, 75, 70, 78, 72, 80, 75, 72]
  // Reverse to show chronological order (oldest to newest) for the sparkline
  return allScoresData.value.slice(0, 10).reverse().map((d: any) => d.score)
})

// Chart options
const fatigueTimelineOption = computed<EChartsOption>(() => {
  const textColor = isDark.value ? '#94A3B8' : '#64748B'
  const gridColor = isDark.value ? '#334155' : '#E2E8F0'
  const data = filteredFatigueData.value
  
  if (!data || data.length === 0) {
    return {
      title: { text: 'No data for selected period', left: 'center', top: 'center', textStyle: { color: textColor, fontSize: 14 } },
      grid: { top: 20, right: 70, bottom: 50, left: 50 }
    }
  }
  
  const timeLabels = data.map((d: any) => d.date)
  const scores = data.map((d: any) => d.score)
  
  return {
    tooltip: { trigger: 'axis', backgroundColor: isDark.value ? '#1E293B' : '#fff', borderColor: gridColor, textStyle: { color: isDark.value ? '#F1F5F9' : '#1E293B' } },
    grid: { top: 40, right: 70, bottom: 40, left: 60 },
    xAxis: { type: 'category', data: timeLabels, axisLine: { lineStyle: { color: gridColor } }, axisLabel: { color: textColor, rotate: fatigueViewMode.value === 'month' ? 45 : 0 } },
    yAxis: { type: 'value', min: 0, max: 100, name: 'Fatigue Score', nameTextStyle: { color: textColor }, axisLine: { lineStyle: { color: gridColor } }, axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor, type: 'dashed' } } },
    series: [{
      type: 'line', data: scores, smooth: true, lineStyle: { width: 3, color: '#667EEA' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(102, 126, 234, 0.4)' }, { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }] } },
      itemStyle: { color: '#667EEA' }, symbolSize: 8,
      markLine: { silent: true, data: [
        { yAxis: 60, lineStyle: { color: '#F59E0B', type: 'dashed', width: 2 }, label: { formatter: 'Warning', color: '#F59E0B', position: 'end', fontSize: 12 } },
        { yAxis: 80, lineStyle: { color: '#EF4444', type: 'dashed', width: 2 }, label: { formatter: 'Critical', color: '#EF4444', position: 'end', fontSize: 12 } }
      ]}
    }]
  }
})

const blinkDurationOption = computed<EChartsOption>(() => {
  const textColor = isDark.value ? '#94A3B8' : '#64748B'
  const gridColor = isDark.value ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
  const data = filteredBlinkData.value
  
  if (!data || data.length === 0) {
    return {
      title: { text: 'No blink data for selected period', left: 'center', top: 'center', textStyle: { color: textColor, fontSize: 14 } },
      grid: { top: 20, right: 20, bottom: 50, left: 50 }
    }
  }
  
  const timeLabels = data.map((d: any) => d.time)
  const leftBlinks = data.map((d: any) => d.leftBlinks)
  const rightBlinks = data.map((d: any) => d.rightBlinks)
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1E293B' : '#fff',
      borderColor: gridColor,
      formatter: (params: any) => {
        const dataIndex = params[0].dataIndex
        const sessionData = data[dataIndex]
        if (!sessionData) return ''
        return `${sessionData.time}<br/>Left Eye: ${sessionData.leftBlinks?.toFixed(1) || 0}ms<br/>Right Eye: ${sessionData.rightBlinks?.toFixed(1) || 0}ms`
      }
    },
    legend: {
      data: ['Left Eye', 'Right Eye'],
      textStyle: { color: textColor },
      bottom: 0
    },
    grid: { top: 20, right: 20, bottom: 50, left: 60 },
    xAxis: {
      type: 'category',
      data: timeLabels,
      axisLabel: { color: textColor, rotate: 15 }
    },
    yAxis: {
      type: 'value',
      name: 'Blink Duration (ms)',
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: [
      {
        name: 'Left Eye',
        type: 'bar',
        data: leftBlinks,
        itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: 'Right Eye',
        type: 'bar',
        data: rightBlinks,
        itemStyle: { color: '#8B5CF6', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }
})

// Calculate moving average for pupil data
function calculateMovingAverage(data: number[], windowSize: number = 3): number[] {
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
  const textColor = isDark.value ? '#94A3B8' : '#64748B'
  const gridColor = isDark.value ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
  const data = filteredPupilData.value
  
  if (!data || data.length === 0) {
    return {
      title: { text: 'No pupil data for selected period', left: 'center', top: 'center', textStyle: { color: textColor, fontSize: 14 } },
      grid: { top: 40, right: 30, bottom: 60, left: 60 }
    }
  }
  
  const timeLabels = data.map((d: any) => d.time)
  const leftPupilData = data.map((d: any) => d.leftPupil)
  const rightPupilData = data.map((d: any) => d.rightPupil)
  
  // Calculate moving averages
  const leftMA = calculateMovingAverage(leftPupilData, 3)
  const rightMA = calculateMovingAverage(rightPupilData, 3)
  
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
      axisTick: { show: false },
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
      min: 0,
      max: 6,
      interval: 1,
      axisLine: { show: false },
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
      // Left Moving Average - Dashed trend line (light green)
      {
        name: 'Left MA',
        type: 'line',
        data: leftMA,
        smooth: true,
        symbol: 'none',
        connectNulls: false,
        lineStyle: { 
          color: 'rgba(16, 185, 129, 0.5)', 
          width: 2,
          type: 'dashed'
        },
        z: 2
      },
      // Left Pupil - Solid line (green)
      {
        name: 'Left Pupil',
        type: 'line',
        data: leftPupilData,
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        connectNulls: false,
        lineStyle: { 
          color: '#10B981', 
          width: 2
        },
        itemStyle: { 
          color: '#10B981',
          borderWidth: 2,
          borderColor: '#fff'
        },
        z: 3
      },
      // Right Moving Average - Dashed trend line (light orange)
      {
        name: 'Right MA',
        type: 'line',
        data: rightMA,
        smooth: true,
        symbol: 'none',
        connectNulls: false,
        lineStyle: { 
          color: 'rgba(245, 158, 11, 0.5)', 
          width: 2,
          type: 'dashed'
        },
        z: 2
      },
      // Right Pupil - Solid line (orange)
      {
        name: 'Right Pupil',
        type: 'line',
        data: rightPupilData,
        smooth: false,
        connectNulls: false,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { 
          color: '#F59E0B', 
          width: 2
        },
        itemStyle: { 
          color: '#F59E0B',
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

// Export Report function
const exportReport = async () => {
  const exportBtn = document.querySelector('.export-panel-btn') as HTMLElement
  const originalBtnContent = exportBtn?.innerHTML
  let tempContainer: HTMLElement | null = null
  
  try {
    // Show loading state
    if (exportBtn) {
      exportBtn.style.pointerEvents = 'none'
      exportBtn.style.opacity = '0.6'
      exportBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i>'
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
    
    // Get the main content container
    const mainContent = document.querySelector('.details-content') as HTMLElement
    if (!mainContent) {
      throw new Error('Content not found')
    }
    
    // Create temporary container with clone
    const containerWidth = 1300
    const a4PortraitRatio = 210 / 297
    const containerHeight = Math.floor(containerWidth / a4PortraitRatio)
    
    tempContainer = document.createElement('div')
    tempContainer.style.position = 'fixed'
    tempContainer.style.left = '-99999px'
    tempContainer.style.top = '0'
    tempContainer.style.width = `${containerWidth}px`
    tempContainer.style.minHeight = `${containerHeight}px`
    tempContainer.style.padding = '40px'
    tempContainer.style.background = '#FFFFFF' // Always use light mode for PDF export
    tempContainer.style.zIndex = '-1'
    tempContainer.style.boxSizing = 'border-box'
    tempContainer.style.overflow = 'visible'
    
    // Remove dark-mode class to ensure light mode styling
    tempContainer.classList.remove('dark-mode')
    
    const clone = mainContent.cloneNode(true) as HTMLElement
    clone.style.width = '100%'
    clone.style.maxWidth = '100%'
    clone.style.margin = '0'
    clone.style.padding = '0'
    clone.style.boxSizing = 'border-box'
    
    // Remove dark-mode class from clone and all children
    clone.classList.remove('dark-mode')
    const darkElements = clone.querySelectorAll('.dark-mode')
    darkElements.forEach(el => el.classList.remove('dark-mode'))
    
    tempContainer.appendChild(clone)
    document.body.appendChild(tempContainer)
    
    // Wait for clone to render
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Ensure all images in clone are loaded, including avatar
    const clonedImages = Array.from(tempContainer.querySelectorAll('img'))
    await Promise.all(
      clonedImages.map(img => {
        const imgElement = img as HTMLImageElement
        if (imgElement.complete) {
          return Promise.resolve()
        }
        return new Promise(resolve => {
          imgElement.onload = resolve
          imgElement.onerror = resolve
          // Force reload if src is set
          if (imgElement.src) {
            const src = imgElement.src
            imgElement.src = ''
            imgElement.src = src
          }
          setTimeout(resolve, 200)
        })
      })
    )
    
    // Additional wait for images to settle
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Hide elements not needed in PDF export
    // Hide search sessions input
    const searchInput = tempContainer.querySelector('.search-input')
    if (searchInput) {
      (searchInput as HTMLElement).style.display = 'none'
    }
    
    // Hide pagination controls
    const pagination = tempContainer.querySelector('.sessions-pagination')
    if (pagination) {
      (pagination as HTMLElement).style.display = 'none'
    }
    
    // Add page break before session history section
    const sessionsSection = tempContainer.querySelector('.sessions-section')
    if (sessionsSection) {
      const sectionElement = sessionsSection as HTMLElement
      sectionElement.style.setProperty('page-break-before', 'always')
      sectionElement.style.setProperty('break-before', 'page')
      sectionElement.style.marginTop = '100px'
      sectionElement.style.paddingTop = '60px'
    }
    
    // Ensure session table doesn't split across pages
    const sessionsCard = tempContainer.querySelector('.sessions-card')
    if (sessionsCard) {
      const cardElement = sessionsCard as HTMLElement
      cardElement.style.setProperty('page-break-inside', 'avoid')
      cardElement.style.setProperty('break-inside', 'avoid')
    }
    
    // Remove Actions column completely from session history table
    const tables = tempContainer.querySelectorAll('.el-table')
    tables.forEach((table) => {
      // Find and remove Actions column header (th)
      const headers = table.querySelectorAll('th')
      headers.forEach((th) => {
        if (th.textContent?.trim() === 'Actions') {
          th.remove()
        }
      })
      
      // Find and remove Actions column cells (td) - last column in each row
      const rows = table.querySelectorAll('tbody tr')
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        // Remove the last cell which is the Actions column
        if (cells.length > 0) {
          const lastCell = cells[cells.length - 1]
          // Check if it contains action buttons
          if (lastCell && (lastCell.querySelector('.el-button') || lastCell.querySelector('.mdi-eye'))) {
            lastCell.remove()
          }
        }
      })
      
      // Adjust table column widths to fill space
      const tableElement = table as HTMLElement
      tableElement.style.width = '100%'
      tableElement.style.tableLayout = 'auto'
    })
    
    // Remove fixed heights from chart containers
    const chartContainers = tempContainer.querySelectorAll('[class*="chart"]')
    chartContainers.forEach((container) => {
      const elem = container as HTMLElement
      elem.style.height = 'auto'
      elem.style.minHeight = 'auto'
      elem.style.maxHeight = 'none'
      elem.style.overflow = 'visible'
    })
    
    // Replace ECharts canvas elements with images
    const originalCharts = mainContent.querySelectorAll('canvas')
    const clonedCharts = tempContainer.querySelectorAll('canvas')
    
    clonedCharts.forEach((clonedCanvas, index) => {
      const originalCanvas = originalCharts[index] as HTMLCanvasElement
      if (originalCanvas && originalCanvas.width > 0 && originalCanvas.height > 0) {
        try {
          const imgData = originalCanvas.toDataURL('image/png')
          const img = document.createElement('img')
          img.src = imgData
          
          const aspectRatio = originalCanvas.height / originalCanvas.width
          img.style.width = '100%'
          img.style.maxWidth = '100%'
          img.style.height = 'auto'
          img.style.minHeight = `${aspectRatio * 100}%`
          img.style.display = 'block'
          img.style.objectFit = 'contain'
          
          if (clonedCanvas.parentNode) {
            const parent = clonedCanvas.parentNode as HTMLElement
            parent.style.width = '100%'
            parent.style.maxWidth = '100%'
            parent.style.height = 'auto'
            parent.style.minHeight = 'auto'
            parent.style.maxHeight = 'none'
            parent.style.display = 'block'
            parent.style.overflow = 'visible'
            
            let ancestor = parent.parentElement
            while (ancestor && ancestor !== tempContainer) {
              ancestor.style.height = 'auto'
              ancestor.style.minHeight = 'auto'
              ancestor.style.maxHeight = 'none'
              ancestor.style.overflow = 'visible'
              ancestor = ancestor.parentElement
            }
            
            clonedCanvas.parentNode.replaceChild(img, clonedCanvas)
          }
        } catch (e) {
          console.warn('Failed to convert chart canvas:', e)
        }
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const allImages = tempContainer.querySelectorAll('img')
    allImages.forEach((img) => {
      const isChartImage = img.closest('[class*="chart"]') !== null
      if (isChartImage) {
        img.style.width = '100%'
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
        img.style.minHeight = 'auto'
        img.style.maxHeight = 'none'
        img.style.objectFit = 'contain'
        
        let parent = img.parentElement
        while (parent && parent !== tempContainer) {
          parent.style.height = 'auto'
          parent.style.minHeight = 'auto'
          parent.style.maxHeight = 'none'
          parent.style.overflow = 'visible'
          parent = parent.parentElement
        }
      }
    })
    
    const captureHeight = tempContainer.scrollHeight
    
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF', // Always use light mode for PDF export
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
    
    // Create PDF
    const pdfWidth = 210
    const pdfHeight = 297
    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = pdfHeight
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pageHeight
    }
    
    const username = userData.value?.name?.toLowerCase().replace(/\s+/g, '-') || 'user'
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `user-report-${username}-${timestamp}.pdf`
    
    pdf.save(filename)
    
    ElMessage.success('Report exported successfully!')
    
  } catch (err) {
    console.error('PDF export failed:', err)
    ElMessage.error(`Failed to export report: ${err instanceof Error ? err.message : 'Unknown error'}`)
  } finally {
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer)
    }
    
    if (exportBtn && originalBtnContent) {
      exportBtn.style.pointerEvents = 'auto'
      exportBtn.style.opacity = '1'
      exportBtn.innerHTML = originalBtnContent
    }
  }
}

// Fetch user data
async function fetchUserData() {
  if (!props.userId) return
  
  loading.value = true
  error.value = null
  
  try {
    const currentUserId = parseInt(props.userId)
    let userProfile: any
    let scores: any[] = []
    
    // Use pool admin API if in pool admin mode
    if (props.isPoolAdmin || poolAdminStore.isAuthenticated) {
      // Fetch user from pool admin store
      userProfile = await poolAdminStore.fetchUser(currentUserId)
      if (!userProfile) {
        throw new Error('User not found or access denied')
      }
      
      // Fetch scores from pool admin API
      scores = await poolAdminStore.fetchUserScores(currentUserId)
    } else {
      // Get tenant ID for regular/superadmin mode
      let tenantId: number
      if (superadminStore.isAuthenticated && superadminStore.selectedDeviceId) {
        tenantId = superadminStore.selectedDeviceId
      } else {
        tenantId = parseInt(authStore.user?.tenant_id || '1')
      }
      
      // Fetch user and scores in parallel (storage_avg is fetched on "Load More")
      const [profile, scoresData] = await Promise.all([
        getUser(currentUserId),
        listScores(tenantId, currentUserId)
      ])
      userProfile = profile
      scores = scoresData
    }
    
    // Process scores without storage data initially
    // Storage data (blink/pupil) will be fetched when user clicks "Load More"
    const scoresWithData = (Array.isArray(scores) ? scores : []).map((score: any) => {
      return {
        ...score,
        leftPupilSize: 0,
        rightPupilSize: 0,
        leftBlinkDuration: 0,
        rightBlinkDuration: 0,
        leftMA: 0,
        rightMA: 0,
        sessionDate: score.created_at
      }
    })
    
    allScoresData.value = scoresWithData
    
    // Calculate stats
    // Note: API returns scores sorted by created_at DESC (newest first)
    const validScores = scoresWithData.filter((s: any) => s.score !== null && s.score !== undefined)
    const avgScore = validScores.length > 0 ? validScores.reduce((sum: number, s: any) => sum + s.score, 0) / validScores.length : 0
    // Latest score is the FIRST item since API returns DESC order (newest first)
    const latestScore = validScores.length > 0 ? validScores[0]?.score : 0
    
    // Calculate standard deviation
    let stdDev = 0
    if (validScores.length > 1) {
      const variance = validScores.reduce((sum: number, s: any) => sum + Math.pow(s.score - avgScore, 2), 0) / validScores.length
      stdDev = Math.sqrt(variance)
    }
    
    // Build sessions from scores
    const sessions = scoresWithData.map((score: any, idx: number) => ({
      sessionId: score.key || `session-${idx}`,
      date: score.created_at,
      fatigueScore: Math.round(score.score),
      leftPupilSize: score.leftPupilSize || 0,
      rightPupilSize: score.rightPupilSize || 0,
      leftBlinkDuration: score.leftBlinkDuration || 0,
      rightBlinkDuration: score.rightBlinkDuration || 0,
      status: 'completed'
    }))
    
    // Generate insights based on data
    const insights = []
    if (avgScore >= 70) {
      insights.push({
        id: 1,
        type: 'fatigue',
        title: 'High Fatigue Detected',
        description: 'Average fatigue score is above 70. Consider more frequent breaks.',
        severity: 'warning'
      })
    }
    if (stdDev > 20) {
      insights.push({
        id: 2,
        type: 'pattern',
        title: 'Inconsistent Patterns',
        description: 'High variability in fatigue scores suggests irregular work patterns.',
        severity: 'info'
      })
    }
    
    // Get latest score date (first item since API returns DESC order - newest first)
    const latestScoreData = validScores.length > 0 ? validScores[0] : null
    const latestScoreDate = latestScoreData?.created_at || latestScoreData?.sessionDate || null
    
    // Set all chart dates to the latest score's month
    if (latestScoreDate) {
      const latestDate = new Date(latestScoreDate)
      fatigueSelectedDate.value = latestDate
      blinkSelectedDate.value = latestDate
      pupilSelectedDate.value = latestDate
    }
    
    userData.value = {
      id: userProfile.id,
      name: userProfile.name || `User ${userProfile.pin}`,
      pin: userProfile.pin,
      avatar: userProfile.portrait_image,
      role: 'Player',
      sessionCount: scoresWithData.length,
      latestScore: Math.round(latestScore),
      latestScoreDate: latestScoreDate,
      avgScore: Math.round(avgScore * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100,
      tags: userProfile.tags || [],
      sessions,
      insights
    }
  } catch (err: any) {
    console.error('Error fetching user data:', err)
    error.value = err.message || 'Failed to load user data'
  } finally {
    loading.value = false
  }
}

// Watch for userId changes
watch(() => props.userId, () => {
  if (props.userId) {
    // Reset lazy loading state when user changes
    showMoreContent.value = false
    loadingMoreContent.value = false
    storageDataLoaded.value = false
    fetchUserData()
  }
}, { immediate: true })

// Note: onMounted removed - watch with immediate: true handles initial fetch
</script>

<style lang="scss" scoped>
@import '@/assets/scss/zen-variables';
@import '@/assets/scss/responsive';

.user-detail-panel {
  position: relative;
  min-height: 400px;
  padding-left: 4px;
  padding-right: 4px;

  @include from-tablet {
    padding-left: 8px;
    padding-right: 8px;
  }

  @include from-desktop {
    padding-left: 12px;
    padding-right: 12px;
  }
}

.close-panel-btn,
.edit-panel-btn,
.export-panel-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--zen-border-medium);
  border-radius: $radius-full;
  background: var(--zen-bg-secondary);
  color: var(--zen-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  i { font-size: 18px; }
}

.close-panel-btn {
  &:hover {
    background: var(--zen-accent-danger);
    border-color: var(--zen-accent-danger);
    color: white;
  }
}

.edit-panel-btn,
.export-panel-btn {
  &:hover {
    background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.15));
    border-color: var(--zen-accent-teal);
    color: var(--zen-accent-teal);
  }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: $space-4;
  padding: $space-4;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;

  i {
    font-size: 48px;
    color: var(--zen-accent-teal);
  }

  span {
    color: var(--zen-text-secondary);
    font-size: $text-body-sm;
  }
}

.error-container {
  i {
    font-size: 64px;
    color: var(--zen-accent-danger);
  }

  h3 {
    color: var(--zen-text-heading);
    margin: 0;
    font-size: $text-title-md;
  }

  p {
    color: var(--zen-text-muted);
    text-align: center;
  }
}

.details-content {
  max-width: 100%;
  padding: 12px 0;
  position: relative;
  z-index: 1;

  @include from-tablet {
    padding: 16px 0;
  }
}

// Profile Section
.profile-section {
  margin-bottom: 12px;

  @include from-tablet {
    margin-bottom: 16px;
  }
}

.profile-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  width: 100%;

  @include from-tablet {
    gap: 16px;
  }

  @include from-desktop {
    flex-direction: row;
  }
}

.profile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
  box-shadow: none;
  transition: all 0.3s ease;
  width: 100%;

  @include from-tablet {
    flex-direction: row;
    text-align: left;
    gap: $space-4;
    padding: $space-3 $space-4;
    border: 1px solid var(--zen-border-glass);
    border-radius: $radius-xl;
  }

  @include from-desktop {
    flex: 0 0 auto;
    width: 400px;
    border-radius: $radius-xl;
  }
}

.profile-actions {
  position: absolute;
  top: $space-3;
  right: $space-3;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.metrics-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  width: 100%;

  @include from-tablet {
    flex-direction: row;
    gap: 16px;
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

    @include from-tablet {
      font-size: $text-heading-3;
    }
  }

  .user-id {
    font-size: $text-body-xs;
    color: var(--zen-text-muted);
    margin: 0 0 $space-1;

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

  .user-tags-section {
    margin-top: $space-3;
    padding-top: $space-3;
    border-top: 1px solid var(--zen-border);

    .tags-display {
      display: flex;
      flex-wrap: wrap;
      gap: $space-2;
      justify-content: center;

      @include from-tablet {
        justify-content: flex-start;
      }
    }
  }
}

// Charts Section
.charts-section {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @include from-tablet {
    margin-bottom: 16px;
    gap: 16px;
  }
}

// Load More Section
.load-more-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
  background: var(--zen-surface);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--zen-accent-teal);
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--zen-accent-teal-dark, #0891b2);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  i {
    font-size: 18px;
  }
}

.chart-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
  overflow: hidden;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  @include from-tablet {
    border: 1px solid var(--zen-border-glass);
    border-radius: $radius-xl;
    margin-bottom: 0;
  }

  &:last-child {
    @include from-tablet {
      border-radius: $radius-xl;
    }
  }

  &.full-width {
    width: 100%;
  }
}

.chart-header {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--zen-border-glass);

  @include from-tablet {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: $space-2 $space-3;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin: 0;
    font-size: $text-body-lg;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);

    i {
      color: var(--zen-accent-teal);
      font-size: 20px;
    }
  }
}

.date-navigator {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
}

.date-picker-group {
  display: flex;
  align-items: center;
  gap: $space-1;
  background: var(--zen-accent-teal);
  border-radius: $radius-full;
  padding: $space-1;
}

.nav-arrow {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: $radius-full;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  i {
    font-size: 20px;
  }
}

.current-date {
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  color: white;
  padding: 0 $space-2;
  min-width: 80px;
  text-align: center;
}

.view-toggle {
  display: flex;
  background: var(--zen-bg-secondary);
  border-radius: $radius-full;
  padding: 3px;
  border: 1px solid var(--zen-border-light);
}

.toggle-btn {
  padding: $space-2 $space-3;
  border: none;
  border-radius: $radius-full;
  background: transparent;
  color: var(--zen-text-secondary);
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--zen-text-primary);
  }

  &.active {
    background: var(--zen-accent-teal);
    color: white;
    box-shadow: var(--zen-shadow-sm);
  }
}

.chart-body {
  padding: $space-3;
  min-height: 220px;

  @include from-tablet {
    padding: $space-3 $space-4;
  }
}

// Sessions Section
.sessions-section {
  margin-bottom: 12px;

  @include from-tablet {
    margin-bottom: 16px;
  }
}

.sessions-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
  overflow: hidden;

  @include from-tablet {
    border: 1px solid var(--zen-border-glass);
    border-radius: $radius-xl;
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  border-bottom: 1px solid var(--zen-border-glass);

  @include from-tablet {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: $space-4 $space-5;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin: 0;
    font-size: $text-body-lg;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);

    i {
      color: var(--zen-accent-teal);
    }
  }
}

.search-input {
  width: 100%;

  @include from-tablet {
    width: 200px;
  }
}

.sessions-table-wrapper {
  padding: $space-3;
  overflow-x: auto;

  @include from-tablet {
    padding: $space-4;
  }
}

// Dark mode styles for Element Plus table
.dark-mode {
  .sessions-card {
    background: var(--zen-surface);
  }

  :deep(.el-table) {
    --el-table-bg-color: transparent !important;
    --el-table-tr-bg-color: transparent !important;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.05) !important;
    --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.08) !important;
    --el-table-text-color: #e2e8f0 !important;
    --el-table-header-text-color: #94a3b8 !important;
    --el-table-border-color: rgba(255, 255, 255, 0.1) !important;
    --el-fill-color-lighter: rgba(255, 255, 255, 0.03) !important;
    background: transparent !important;
  }

  :deep(.el-table__inner-wrapper) {
    background: transparent !important;
  }

  :deep(.el-table__header-wrapper) {
    background: transparent !important;
  }

  :deep(.el-table__header th) {
    background: rgba(255, 255, 255, 0.05) !important;
    color: #94a3b8 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  :deep(.el-table__header th .cell) {
    color: #94a3b8 !important;
  }

  :deep(.el-table__body-wrapper) {
    background: transparent !important;
  }

  :deep(.el-table__body tr) {
    background: transparent !important;
  }

  :deep(.el-table__body tr:hover > td) {
    background: rgba(255, 255, 255, 0.08) !important;
  }

  :deep(.el-table__body td) {
    background: transparent !important;
    color: #e2e8f0 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  :deep(.el-table__body td .cell) {
    color: #e2e8f0 !important;
  }

  :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
    background: rgba(255, 255, 255, 0.03) !important;
  }

  :deep(.el-table__empty-block) {
    background: transparent !important;
    color: #94a3b8 !important;
  }

  :deep(.el-table__empty-text) {
    color: #94a3b8 !important;
  }

  :deep(.el-pagination) {
    --el-pagination-bg-color: transparent;
    --el-pagination-text-color: #94a3b8;
    --el-pagination-button-color: #94a3b8;
    --el-pagination-hover-color: #06b6d4;
  }

  :deep(.el-pagination button),
  :deep(.el-pagination .el-pager li) {
    background: transparent !important;
    color: #94a3b8 !important;
  }

  :deep(.el-pagination .el-pager li.is-active) {
    color: #06b6d4 !important;
  }

  // Search input dark mode
  :deep(.el-input__wrapper) {
    background-color: rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  }

  :deep(.el-input__inner) {
    color: #e2e8f0 !important;
    
    &::placeholder {
      color: #64748b !important;
    }
  }

  :deep(.el-input__prefix) {
    color: #64748b !important;
  }

  // Table header dark mode - more specific
  :deep(.el-table__header-wrapper) {
    background: #1e293b !important;
  }

  :deep(.el-table__header) {
    background: #1e293b !important;
  }

  :deep(.el-table__header tr) {
    background: #1e293b !important;
  }

  :deep(.el-table__header th) {
    background: #1e293b !important;
    background-color: #1e293b !important;
    color: #94a3b8 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  :deep(.el-table thead) {
    background: #1e293b !important;
  }

  :deep(.el-table thead th.el-table__cell) {
    background: #1e293b !important;
    background-color: #1e293b !important;
    color: #94a3b8 !important;
  }

  :deep(.el-table th.el-table__cell) {
    background: #1e293b !important;
    background-color: #1e293b !important;
  }

  :deep(.el-table .el-table__cell.is-sortable) {
    background: #1e293b !important;
  }
}

.session-id {
  font-family: monospace;
  font-size: $text-body-sm;
  color: var(--zen-text-secondary);
  
  &.truncated {
    cursor: pointer;
    padding: 2px 6px;
    background: var(--zen-bg-tertiary);
    border-radius: 4px;
    transition: background 0.2s ease;
    
    &:hover {
      background: var(--zen-bg-hover);
      color: var(--zen-text-primary);
    }
  }
}

.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: $space-1 $space-2;
  border-radius: $radius-full;
  font-weight: $font-weight-semibold;
  font-size: $text-body-sm;

  &.low {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }

  &.medium {
    background: rgba(245, 158, 11, 0.1);
    color: #F59E0B;
  }

  &.high {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }
}

.metric-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: $text-body-sm;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: default;
  
  &.pupil {
    background: rgba(99, 102, 241, 0.1);
    color: #818CF8;
  }
  
  &.blink {
    background: rgba(6, 182, 212, 0.1);
    color: #22D3EE;
  }
}

.sessions-pagination {
  display: flex;
  justify-content: center;
  padding: $space-4;
  border-top: 1px solid var(--zen-border-glass);
}

// Insights Section
.insights-section {
  margin-bottom: 0;

  @include from-tablet {
    margin-bottom: $space-5;
  }
}

.section-header {
  padding: $space-4;
  padding-bottom: $space-3;

  @include from-tablet {
    padding: 0 0 $space-4 0;
  }

  h2 {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin: 0;
    font-size: $text-title-sm;
    font-weight: $font-weight-bold;
    color: var(--zen-text-heading);

    i {
      color: var(--zen-accent-amber);
    }
  }
}

.insights-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  padding: 0 $space-4 $space-4;

  @include from-tablet {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    padding: 0;
  }
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4;
  background: var(--zen-surface);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
  transition: all 0.3s ease;

  &.info {
    border-left: 4px solid var(--zen-accent-teal);
  }

  &.warning {
    border-left: 4px solid var(--zen-accent-amber);
  }

  &.critical {
    border-left: 4px solid var(--zen-accent-danger);
  }
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: $radius-lg;
  background: var(--zen-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 20px;
    color: var(--zen-accent-teal);
  }
}

.insight-content {
  flex: 1;

  h4 {
    margin: 0 0 $space-1;
    font-size: $text-body-md;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);
  }

  p {
    margin: 0;
    font-size: $text-body-sm;
    color: var(--zen-text-secondary);
    line-height: 1.5;
  }
}

.insight-badge {
  padding: $space-1 $space-2;
  border-radius: $radius-full;
  font-size: $text-body-xs;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  background: var(--zen-bg-secondary);
  color: var(--zen-text-muted);
}
</style>
