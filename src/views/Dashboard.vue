<template>
  <div class="dashboard-layout" :class="{ 'dark-mode': isDark }">
    <!-- New Sidebar with Members/Options Toggle -->
    <Sidebar 
      :members="members" 
      :selected-member-id="selectedMemberId"
      @select-member="handleMemberSelect"
      @deselect-member="handleMemberDeselect"
      @view-details="navigateToUserDetails"
      @create-user="handleCreateUser"
    />

    <!-- Main Content -->
    <main class="dashboard-main">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">{{ pageTitle }}</h1>
            <p class="page-subtitle">{{ pageSubtitle }}</p>
          </div>
          <div class="header-right">
            <div class="desktop-only">
              <LanguageToggle />
            </div>
            <div class="desktop-only">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <i class="mdi mdi-loading mdi-spin"></i>
          <span>Loading dashboard data...</span>
        </div>

        <template v-else>
          <!-- Member Summary (shown when member is selected) -->
          <transition name="slide-down">
            <section v-if="selectedMember && selectedMemberDashboard" class="member-summary-section">
              <MemberSummaryCard
                :member="selectedMember"
                :summary="selectedMemberDashboard.summary"
                @close="handleMemberDeselect"
                @view-details="navigateToUserDetails"
                @update-member="handleUpdateMember"
              />
            </section>
          </transition>

          <!-- Stats Cards Row - Only show when no member is selected -->
          <section v-if="!selectedMemberId" class="stats-section">
            <div class="stats-grid">
              <div class="stat-card purple">
                <div class="stat-icon">
                  <i class="mdi mdi-account-group"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ globalStats.totalUsers }}</span>
                  <span class="stat-label">Total Users</span>
                </div>
              </div>
              <div class="stat-card cyan">
                <div class="stat-icon">
                  <i class="mdi mdi-folder-eye"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ globalStats.totalSessions }}</span>
                  <span class="stat-label">Total Sessions</span>
                </div>
              </div>
              <div class="stat-card green">
                <div class="stat-icon">
                  <i class="mdi mdi-chart-arc"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ globalStats.avgResponse }}%</span>
                  <span class="stat-label">Avg Response</span>
                </div>
              </div>
              <div class="stat-card orange">
                <div class="stat-icon">
                  <i class="mdi mdi-target"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ globalStats.accuracyRate }}</span>
                  <span class="stat-label">Accuracy Rate</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Charts Section -->
          <section class="charts-section">
            <!-- Fatigue Timeline (Full Width) - Statistics Style -->
            <div class="chart-card full-width statistics-card">
              <div class="chart-header statistics-header">
                <div class="chart-title-group">
                  <h3 class="statistics-title">Statistics</h3>
                  <span class="statistics-label">BRAIN FATIGUE{{ selectedMember ? ` - ${selectedMember.name}` : '' }}</span>
                </div>
                
                <!-- Date Range Selector -->
                <div class="date-range-selector">
                  <button class="nav-arrow" @click="navigateDateRange('prev')">
                    <i class="mdi mdi-chevron-left"></i>
                  </button>
                  <span class="date-range-display">{{ navLabel }}</span>
                  <button class="nav-arrow" @click="navigateDateRange('next')">
                    <i class="mdi mdi-chevron-right"></i>
                  </button>
                </div>

                <!-- Day/Week/Month Toggle -->
                <div class="period-toggle">
                  <button 
                    v-for="period in periods" 
                    :key="period.value"
                    class="period-btn"
                    :class="{ active: mode === period.value }"
                    @click="mode = period.value"
                  >
                    {{ period.label }}
                  </button>
                </div>
              </div>
              <div class="chart-body statistics-body">
                <!-- Chart container always visible -->
                <div class="chart-container">
                  <div id="chart1" class="fatigue-chart"></div>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>

      <!-- Footer -->
      <footer class="dashboard-footer">
        <span>© {{ new Date().getFullYear() }} NeuralPort Japan • ZEN EYE PRO</span>
        <span class="version">v1.0.0</span>
      </footer>
    </main>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTheme } from '../composables/useTheme'
import { useAuthStore } from '../stores/auth'
import { API_BASE_URL, getUsersByGroup, getLatestScore, listScores, getUser, createUser, renameUser, updateAvatar } from '../lib/api'
import * as echarts from "echarts"
import _ from "lodash"
import {
    format, addDays, addWeeks, addMonths,
    startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth
} from 'date-fns'

// Components
import Sidebar from '../components/zen/Sidebar.vue'
import ThemeToggle from '../components/zen/ThemeToggle.vue'
import LanguageToggle from '../components/zen/LanguageToggle.vue'
import MemberSummaryCard from '../components/zen/MemberSummaryCard.vue'

export default defineComponent({
    name: "Dashboard",
    components: { 
        Sidebar, 
        ThemeToggle, 
        LanguageToggle, 
        MemberSummaryCard 
    },
    props: {
        login_user_id_from_path: { type: String, required: false }
    },
    setup() {
        const { isDark } = useTheme()
        const router = useRouter()
        
        return {
            isDark,
            router
        }
    },
    data() {
        return {
            loading: false,
            mode: "Month",
            current: new Date(),
            
            periods: [
                { label: 'Day', value: 'Day' },
                { label: 'Week', value: 'Week' },
                { label: 'Month', value: 'Month' }
            ],
            
            chart1: null,
            user_info: {},
            latest_score: { score_value: 0.0, createdAt: "" },
            average: 0.0,
            standard_deviation: 0.0,
            totalDataPoints: 0,
            group: [],
            selectedMemberId: null,
            members: [],
            
            globalStats: {
                totalUsers: 0,
                totalSessions: 0,
                avgResponse: 0,
                accuracyRate: '0%'
            }
        }
    },
    computed: {
        loginUserId() {
            return this.login_user_id_from_path ?? ""
        },
        
        isAdmin() {
            const authStore = useAuthStore()
            return authStore.user?.is_admin === true
        },
        
        pageTitle() {
            return this.isAdmin ? 'Admin Dashboard' : 'Dashboard'
        },
        
        pageSubtitle() {
            if (this.isAdmin) {
                return 'Overview of all users and performance metrics'
            }
            return 'Your performance metrics and statistics'
        },
        
        navLabel() {
            if (this.mode === "Day") return format(this.current, "yyyy/M/d")

            let start, end
            if (this.mode === "Week") {
                start = startOfWeek(this.current, { weekStartsOn: 1 })
                end = endOfWeek(this.current, { weekStartsOn: 1 })
            } else {
                start = startOfMonth(this.current)
                end = endOfMonth(this.current)
            }

            const sameYear = start.getFullYear() === end.getFullYear()
            const sameMonth = sameYear && start.getMonth() === end.getMonth()

            if (sameYear && sameMonth) {
                return `${format(start, "yyyy/M/d")}〜${format(end, "d")}`
            }
            if (sameYear) {
                return `${format(start, "yyyy/M/d")}〜${format(end, "M/d")}`
            }
            return `${format(start, "yyyy/M/d")}〜${format(end, "yyyy/M/d")}`
        },
        
        _user_info() {
            if (typeof this.user_info !== 'object') {
                return {}
            }
            try {
                const obj = JSON.parse(this.user_info.serializedProfile) || {}
                const isNumberUsername = /^\d+$/.test(this.user_info.username)
                return {
                    ...obj,
                    name: isNumberUsername ? obj.name : this.user_info.username
                }
            } catch (e) {
                return { name: this.user_info.username || '' }
            }
        },
        
        selectedMember() {
            if (!this.selectedMemberId) return null
            return this.members.find(m => m.id === this.selectedMemberId) || null
        },
        
        selectedMemberDashboard() {
            if (!this.selectedMember) return null
            
            return {
                memberId: this.selectedMemberId,
                summary: {
                    latestFatigueScore: this.latest_score.score_value || 0,
                    latestScoreDate: this.latest_score.createdAt || null,
                    averageScore: this.average || 0,
                    standardDeviation: this.standard_deviation || 0,
                    totalSessions: this.totalDataPoints || 0
                }
            }
        },
        
        isNewUser() {
            if (this.selectedMemberDashboard) {
                return this.selectedMemberDashboard.summary.totalSessions === 0
            }
            return false
        }
    },
    watch: {
        mode() {
            this.refreshChartWithNewData()
        },
        current() {
            this.refreshChartWithNewData()
        },
        selectedMemberId(newId) {
            if (newId) {
                this.loadMemberData(newId)
            } else {
                this.loadCurrentUserData()
            }
        }
    },
    methods: {
        getUserId() {
            if (this.selectedMemberId) {
                return this.selectedMemberId
            }
            
            const authStore = useAuthStore()
            return String(this.login_user_id_from_path ?? '').trim() !== ''
                ? String(this.login_user_id_from_path)
                : (authStore.user?.id || '')
        },
        
        prev() {
            this.current =
                this.mode === "Day" ? addDays(this.current, -1) :
                this.mode === "Week" ? addWeeks(this.current, -1) :
                addMonths(this.current, -1)
            this.refreshChartWithNewData()
        },
        
        next() {
            this.current =
                this.mode === "Day" ? addDays(this.current, +1) :
                this.mode === "Week" ? addWeeks(this.current, +1) :
                addMonths(this.current, +1)
            this.refreshChartWithNewData()
        },
        
        async refreshChartWithNewData() {
            if (this.chart1) {
                this.destroyChart1()
                await this.$nextTick()
                await this.initChart1()
            }
        },
        
        navigateDateRange(direction) {
            if (direction === 'prev') {
                this.prev()
            } else {
                this.next()
            }
        },
        
        handleMemberSelect(member) {
            this.selectedMemberId = member.id
        },
        
        handleMemberDeselect() {
            this.selectedMemberId = null
        },
        
        navigateToUserDetails(memberId) {
            console.log('Navigate to user details:', memberId)
            this.$router.push(`/user/${memberId}`)
        },
        
        async handleCreateUser(userData) {
            // userData contains: { pin, username, avatar, avatarUrl }
            console.log('Create user:', userData)
            
            const auth = useAuthStore()
            if (!auth || !auth.token) {
                ElMessage.error('Authentication token not found. Please login as admin.')
                return
            }
            
            try {
                // Prepare the request body
                const body = {
                    pin: userData.pin,
                    name: userData.username,
                    uniform_number: userData.pin,
                    portrait_image: userData.avatarUrl || null
                }
                
                // Make API call to create user
                await createUser(body)
                
                // Show success message
                ElMessage.success(`User "${userData.username}" created successfully!`)
                
                // Refresh the member list from backend
                await this.fetchGroup()
                
            } catch (e) {
                console.error('Create user error:', e)
                ElMessage.error(`Network error: ${e?.message || e}`)
            }
        },
        
        async handleUpdateMember(memberData) {
            // memberData contains: { id, username, avatar, avatarUrl }
            console.log('Update member:', memberData)
            
            const auth = useAuthStore()
            if (!auth || !auth.token) {
                ElMessage.error('Authentication token not found. Please login as admin.')
                return
            }
            
            try {
                // Get current member data to check what changed
                const currentMember = this.members.find(m => m.id === memberData.id)
                
                // Update name if changed
                if (currentMember && memberData.username !== currentMember.name) {
                    await renameUser({
                        userId: parseInt(memberData.id),
                        name: memberData.username
                    })
                    console.log('Name updated')
                }
                
                // Update avatar if changed
                if (memberData.avatarUrl && (!currentMember || memberData.avatarUrl !== currentMember.avatarUrl)) {
                    await updateAvatar({
                        userId: parseInt(memberData.id),
                        avatarUrl: memberData.avatarUrl
                    })
                    console.log('Avatar updated')
                }
                
                // Show success message
                ElMessage.success(`Member "${memberData.username}" updated successfully!`)
                
                // Refresh the member list and user info from backend
                await this.fetchGroup()
                if (this.selectedMemberId === memberData.id) {
                    await this.fetchUser()
                    await this.fetchLatest()
                }
                
            } catch (e) {
                console.error('Update member error:', e)
                ElMessage.error(`Network error: ${e?.message || e}`)
            }
        },
        
        async fetchChartData() {
            let lineData = []
            let barData = []

            const auth = useAuthStore()
            const token = auth.token
            const user_id = this.getUserId()
            let start, end
            
            if (this.mode === "Day") {
                start = startOfDay(this.current)
                end = endOfDay(this.current)
            } else if (this.mode === "Week") {
                start = startOfWeek(this.current, { weekStartsOn: 1 })
                end = endOfWeek(this.current, { weekStartsOn: 1 })
            } else {
                start = startOfMonth(this.current)
                end = endOfMonth(this.current)
            }

            console.log('📊 Fetching chart data:', {
                mode: this.mode,
                current: this.current,
                start: start,
                end: end,
                userId: user_id
            })

            try {
                const scores = await listScores(1, parseInt(user_id))
                console.log('📥 Received scores from API:', scores.length, 'total scores')

                const items = Array.isArray(scores) ? scores : []
                
                // Filter items by date range BEFORE processing
                const filteredItems = items.filter(item => {
                    const d = new Date(item.created_at)
                    if (isNaN(d.getTime())) return false
                    const t = d.getTime()
                    return t >= start.getTime() && t <= end.getTime()
                })
                
                console.log('✅ Filtered scores for date range:', filteredItems.length, 'scores')
                console.log('📅 Date range:', format(start, 'yyyy-MM-dd HH:mm'), 'to', format(end, 'yyyy-MM-dd HH:mm'))
                
                if (filteredItems.length > 0) {
                    console.log('🎯 Sample filtered data:', filteredItems.slice(0, 3))
                }
                
                filteredItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                
                // Store total data points for session count
                this.totalDataPoints = filteredItems.length

                let sum = 0
                let sumSq = 0
                let count = 0

                if (this.mode === 'Day') {
                    for (const item of filteredItems) {
                        const d = new Date(item.created_at)
                        if (isNaN(d.getTime())) continue

                        const t = d.getTime()
                        const primary = Number(item.score ?? 0)
                        const secondary = Number(item.score ?? 0)
                        const p = Number.isFinite(primary) ? Math.floor(primary) : 0
                        const s = Number.isFinite(secondary) ? Math.floor(secondary) : p
                        barData.push([t, p])
                        lineData.push([t, s])
                        if (Number.isFinite(primary)) {
                            sum += p
                            sumSq += p * p
                            count++
                        }
                    }
                } else {
                    const dayMap = new Map()
                    for (const item of filteredItems) {
                        const d = new Date(item.created_at)
                        if (isNaN(d.getTime())) continue
                        const y = d.getUTCFullYear()
                        const m = d.getUTCMonth() + 1
                        const day = d.getUTCDate()
                        const key = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                        const primary = Number(item.score ?? 0)
                        const secondary = Number(item.score ?? 0)
                        if (!dayMap.has(key)) {
                            dayMap.set(key, { sumP: 0, sumS: 0, cnt: 0, y, m, day })
                        }
                        const rec = dayMap.get(key)
                        if (Number.isFinite(primary)) { rec.sumP += primary }
                        if (Number.isFinite(secondary)) { rec.sumS += secondary }
                        rec.cnt += 1
                    }
                    const keys = Array.from(dayMap.keys()).sort()
                    for (const key of keys) {
                        const rec = dayMap.get(key)
                        if (!rec || rec.cnt === 0) continue
                        const avgP = Math.floor(rec.sumP / rec.cnt)
                        const avgS = Math.floor(rec.sumS / rec.cnt)
                        const t = Date.UTC(rec.y, rec.m - 1, rec.day, 12, 0, 0)
                        barData.push([t, avgP])
                        lineData.push([t, avgS])
                        sum += avgP
                        sumSq += avgP * avgP
                        count++
                    }
                }

                if (count > 0) {
                    this.average = sum / count
                    this.standard_deviation = Math.sqrt((sumSq / count) - (this.average * this.average))
                } else {
                    this.average = 0.0
                    this.standard_deviation = 0.0
                }

            } catch (err) {
                console.error("fetchChartData error:", err)
            }

            return { lineData, barData, start, end }
        },
        
        async initChart1() {
            const { lineData, barData, start, end } = await this.fetchChartData()
            
            // Update stats after chart data is loaded (for regular users)
            this.updateGlobalStats()
            
            this.chart1 = echarts.init(document.getElementById("chart1"))
            
            const dayStartMs = start.getTime()
            const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000
            const marginMs = 60 * 1000

            const textColor = this.isDark ? '#ffffff' : '#1f2937'
            const gridColor = this.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(31, 41, 55, 0.12)'
            const lineColor = '#8fa4ba'
            const lineGlowColor = 'rgba(34, 211, 238, 0.6)'

            this.chart1.setOption({
                grid: { show: false, left: "50px", right: "50px", bottom: "50px", top: "30px", containLabel: true },
                tooltip: {
                    trigger: "axis",
                    backgroundColor: this.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: this.isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)',
                    borderWidth: 1,
                    textStyle: { color: this.isDark ? '#F1F5F9' : '#1E293B', fontSize: 13, fontWeight: 500 },
                    padding: [10, 15],
                    axisPointer: { 
                        type: "cross",
                        lineStyle: {
                            color: this.isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                            type: 'dashed'
                        }
                    },
                    formatter: params => {
                        if (!params || !params.length) return ""
                        const raw = params[0].data && params[0].data[0] ? params[0].data[0] : null
                        const t = raw == null ? null : (typeof raw === "number" ? raw : new Date(raw).getTime())
                        const timeLabel = t != null
                            ? (this.mode === "Day" && Math.abs(t - dayEndMs) <= 1000 ? "24:00" : format(new Date(t), "yyyy/M/d HH:mm"))
                            : ""
                        
                        let html = `<div style="font-weight: 600; margin-bottom: 8px; color: ${this.isDark ? '#22D3EE' : '#0891B2'}">${timeLabel}</div>`
                        params.forEach(p => {
                            const value = p.data[1]
                            html += `<div style="display: flex; align-items: center; margin-top: 4px;">
                                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color}; margin-right: 8px;"></span>
                                <span style="color: ${this.isDark ? '#CBD5E1' : '#475569'};">Brain Fatigue:</span>
                                <span style="margin-left: 8px; font-weight: 600; color: ${this.isDark ? '#F1F5F9' : '#1E293B'};">${value}</span>
                            </div>`
                        })
                        return html
                    }
                },
                legend: { show: false },
                xAxis: {
                    type: "time",
                    boundaryGap: false,
                    min: this.mode === "Day" ? (dayStartMs - marginMs) : undefined,
                    max: this.mode === "Day" ? (dayEndMs + marginMs) : undefined,
                    axisLine: { lineStyle: { color: gridColor, width: 1 } },
                    axisLabel: { 
                        color: textColor, 
                        fontSize: 11,
                        fontWeight: 500,
                        formatter: value => {
                            const v = typeof value === "number" ? value : new Date(value).getTime()
                            if (this.mode === "Day" && Math.abs(v - dayEndMs) <= 1000) return "24:00"
                            return format(new Date(v), this.mode === "Day" ? "HH:mm" : "M/d")
                        }
                    },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    min: 0,
                    max: 100,
                    axisLine: { show: false },
                    axisLabel: { color: textColor, fontSize: 11, fontWeight: 500 },
                    splitLine: { lineStyle: { color: gridColor, type: 'dashed', width: 1 } }
                },
                series: [
                    {
                        name: "Data A",
                        type: "line",
                        smooth: 0.4,
                        symbol: 'circle',
                        symbolSize: this.mode === 'Month' ? 6 : 10,
                        showSymbol: true,
                        lineStyle: { 
                            width: 3, 
                            color: lineColor,
                            shadowColor: lineGlowColor,
                            shadowBlur: 8,
                            shadowOffsetY: 2
                        },
                        itemStyle: { 
                            color: '#ffffff',
                            borderColor: lineColor, 
                            borderWidth: 3,
                            shadowColor: lineGlowColor,
                            shadowBlur: 6
                        },
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 0, y2: 1,
                                colorStops: [
                                    { offset: 0, color: 'rgba(34, 211, 238, 0.35)' },
                                    { offset: 0.5, color: 'rgba(34, 211, 238, 0.15)' },
                                    { offset: 1, color: 'rgba(34, 211, 238, 0.02)' }
                                ]
                            }
                        },
                        data: lineData
                    }
                ]
            })
        },

        destroyChart1() { 
            if (this.chart1) { 
                this.chart1.dispose()
                this.chart1 = null 
            } 
        },
        
        __resizeHandler: _.throttle(function () {
            if (this.chart1) {
                this.chart1.dispose()
                this.chart1 = null
                this.$nextTick(() => {
                    this.initChart1()
                })
            }
        }, 700),
        
        resizeChart1() {
            if (this.chart1) {
                this.destroyChart1()
                this.$nextTick(() => {
                    this.initChart1()
                })
            }
        },
        
        async fetchLatest() {
            const user_id = this.getUserId()
            try {
                const data = await getLatestScore(1, parseInt(user_id))
                this.latest_score = {
                    score_value: data.score?.score ?? 0.0,
                    createdAt: data.score?.createdAt ?? ""
                }
            } catch (err) {
                console.error('fetchLatest error', err)
            }
        },
        
        async fetchUser() {
            const user_id = this.getUserId()
            try {
                this.user_info = await getUser(parseInt(user_id))
            } catch (err) {
                console.error('fetchUser error', err)
            }
        },
        
        async fetchGroup() {
            try {
                const users = await getUsersByGroup(1)
                this.group = users || []
                
                if (Array.isArray(this.group)) {
                    // Map users with proper name extraction from serializedProfile
                    this.members = this.group.map(user => {
                        let displayName = user.username || `User ${user.id}`
                        let avatarUrl = null
                        let pin = user.username || ''
                        
                        // Try to get friendly name and avatar from serializedProfile
                        if (user.serializedProfile) {
                            try {
                                const profile = JSON.parse(user.serializedProfile)
                                if (profile.name) {
                                    displayName = profile.name
                                }
                                if (profile.portrait_image) {
                                    avatarUrl = profile.portrait_image
                                }
                            } catch (e) {
                                // If parsing fails, keep username
                            }
                        }
                        
                        return {
                            id: String(user.id),
                            name: displayName,
                            pin: pin,
                            avatarUrl: avatarUrl,
                            fatigueScore: 0,
                            status: 'normal'
                        }
                    })
                    
                    // Update stats after members are loaded
                    this.updateGlobalStats()
                }
            } catch (err) {
                console.error('fetchGroup error', err)
            }
        },
        
        updateGlobalStats() {
            // Calculate stats based on whether admin or regular user
            if (this.isAdmin) {
                // Admin sees all users stats
                this.globalStats = {
                    totalUsers: this.members.length,
                    totalSessions: 'N/A',
                    avgResponse: 'N/A',
                    accuracyRate: 'N/A'
                }
            } else {
                // Regular user sees their own stats (calculated from chart data)
                this.globalStats = {
                    totalUsers: 1,  // Always 1 for regular users (themselves)
                    totalSessions: this.totalDataPoints || 0,
                    avgResponse: this.average > 0 ? this.average.toFixed(1) : '0.0',
                    accuracyRate: this.standard_deviation > 0 ? this.standard_deviation.toFixed(1) : '0.0'
                }
            }
        },
        
        async loadCurrentUserData() {
            this.loading = true
            await Promise.all([
                this.fetchUser(),
                this.fetchLatest(),
                this.fetchGroup()
            ])
            this.loading = false
            await this.$nextTick()
            this.initChart1()
        },
        
        async loadMemberData(memberId) {
            this.loading = true
            await Promise.all([
                this.fetchUser(),
                this.fetchLatest()
            ])
            this.loading = false
            await this.$nextTick()
            this.initChart1()
        }
    },

    async mounted() {
        const auth = useAuthStore()
        
        // Admins don't have user data to load, only fetch the group
        if (auth.user?.is_admin) {
            this.loading = true
            await this.fetchGroup()
            this.loading = false
        } else {
            await this.loadCurrentUserData()
        }
        
        window.addEventListener("resize", this.__resizeHandler)
    },
    
    beforeUnmount() {
        if (this.chart1) {
            window.removeEventListener("resize", this.__resizeHandler)
            this.destroyChart1()
        }
    }
})
</script>

<style lang="scss" scoped>
@import '../assets/scss/zen-variables';

.dashboard-layout {
  min-height: 100vh;
  height: 100vh;
  background: var(--zen-bg-gradient);
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}

.dashboard-main {
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;

  @media (max-width: 767px) {
    margin-left: 0;
  }
}

.dashboard-header {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--zen-border-glass);
  padding: $space-4 $space-6;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;

  @media (max-width: 767px) {
    padding: $space-4;
    padding-left: 70px;
  }
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-4;
}

.header-left {
  .page-title {
    font-size: $text-title-lg;
    font-weight: $font-weight-bold;
    color: var(--zen-text-heading);
    margin: 0;
    margin-top: 10px;
    margin-left: 5px;
    transition: color 0.3s ease;
  }

  .page-subtitle {
    font-size: $text-body-sm;
    color: var(--zen-text-muted);
    margin: $space-1 0 0;
    transition: color 0.3s ease;

    @media (max-width: 767px) {
      display: none;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $space-3;

  .desktop-only {
    @media (max-width: 767px) {
      display: none;
    }
  }
}

.export-btn {
  background: var(--zen-accent-teal) !important;
  border-color: var(--zen-accent-teal) !important;
  font-weight: $font-weight-medium;

  i {
    margin-right: $space-2;
  }

  &:hover {
    background: var(--zen-accent-teal-dark) !important;
    border-color: var(--zen-accent-teal-dark) !important;
  }
}

.dashboard-content {
  padding: $space-6;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 767px) {
    padding: $space-0;
    border-radius: 0;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: $space-3;

  i {
    font-size: 48px;
    color: var(--zen-accent-teal);
  }

  span {
    color: var(--zen-text-secondary);
  }
}

.stats-section {
  margin-bottom: $space-6;
  @media (max-width: 500px) {
    margin-bottom: $space-2;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
    gap:0;
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-5;
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
  @media (max-width: 500px) {
    border-radius: 0;
  }
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--zen-shadow-lg);
  }

}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 26px;
    color: white;
  }

  .purple & {
    background: linear-gradient(135deg, #8B5CF6, #A78BFA);
  }

  .cyan & {
    background: linear-gradient(135deg, #06B6D4, #22D3EE);
  }

  .green & {
    background: linear-gradient(135deg, #10B981, #34D399);
  }

  .orange & {
    background: linear-gradient(135deg, #F59E0B, #FBBF24);
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: $text-heading-1;
  font-weight: $font-weight-bold;
  color: var(--zen-text-heading);
  line-height: 1.1;
  transition: color 0.3s ease;
}

.stat-label {
  font-size: $text-body-sm;
  color: var(--zen-text-muted);
  margin-top: $space-1;
  transition: color 0.3s ease;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.chart-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
  @media (max-width: 500px) {
    border-radius: 0;
  }
  overflow: hidden;
  transition: all 0.3s ease;

  &.full-width {
    width: 100%;
  }
}

.statistics-card {
  background: linear-gradient(135deg, #6a8ded 0%, #C2E9FB 50%, #6C8AD4 100%);
  border: none;
  
  .dark-mode & {
    background: linear-gradient(135deg, #4A6BC4 0%, #5B7ACC 50%, #6C8AD4 100%);
  }
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-5;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $space-4 $space-5;
  border-bottom: 1px solid var(--zen-border-light);
  flex-wrap: wrap;
  gap: $space-3;
}

.chart-title {
  h3 {
    font-size: $text-title-sm;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);
    margin: 0;
    transition: color 0.3s ease;
  }

  .chart-subtitle {
    font-size: $text-body-xs;
    color: var(--zen-text-muted);
    margin: $space-1 0 0;
    transition: color 0.3s ease;
  }
}

.time-select {
  width: 110px;

  :deep(.el-input__wrapper) {
    background: var(--zen-bg-secondary) !important;
    border-radius: $radius-md !important;
    box-shadow: none !important;
    border: 1px solid var(--zen-border-light) !important;
  }
}

.export-data-btn,
.milliseconds-btn {
  background: var(--zen-bg-secondary) !important;
  border: 1px solid var(--zen-border-light) !important;
  color: var(--zen-text-secondary) !important;
  font-size: $text-body-xs;

  &:hover {
    background: var(--zen-surface-hover) !important;
    color: var(--zen-text-primary) !important;
  }
}

.statistics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4 $space-5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-wrap: wrap;
  gap: $space-3;
}

.chart-title-group {
  display: flex;
  align-items: baseline;
  gap: $space-3;
}

.statistics-title {
  font-size: $text-title-md;
  font-weight: $font-weight-bold;
  color: white;
  margin: 0;
}

.statistics-label {
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.date-range-selector {
  display: flex;
  align-items: center;
  gap: $space-2;
  background: rgba(255, 255, 255, 0.15);
  border-radius: $radius-full;
  padding: $space-1;
}

.nav-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  i {
    font-size: 20px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }
}

.date-range-display {
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  color: white;
  padding: 0 $space-3;
  min-width: 120px;
  text-align: center;
}

.period-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.15);
  border-radius: $radius-md;
  padding: 3px;
  gap: 2px;
}

.period-btn {
  padding: $space-2 $space-4;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: #3B82F6;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
}

.chart-body {
  padding: $space-4;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.statistics-body {
  padding: $space-4;
  background: transparent;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.chart-container {
  width: 100%;
  height: 320px;
  position: relative;
}

.fatigue-chart {
  width: 100%;
  height: 100%;
  
  @media (max-width: $breakpoint-md) {
    min-width: 600px;
  }

  @media (max-width: $breakpoint-sm) {
    min-width: 500px;
  }
}

.empty-chart-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 320px;
  text-align: center;
  padding: $space-6;
}

.empty-chart-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $space-4;

  i {
    font-size: 40px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.empty-chart-title {
  font-size: $text-title-md;
  font-weight: $font-weight-bold;
  color: white;
  margin: 0 0 $space-2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.empty-chart-text {
  font-size: $text-body-sm;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.6;
  max-width: 400px;
}

.member-summary-section {
  margin-bottom: $space-5;
}

.slide-down-enter-active {
  animation: slideDown 0.3s ease-out;
}

.slide-down-leave-active {
  animation: slideDown 0.3s ease-in reverse;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-footer {
  padding: $space-5;
  text-align: center;
  font-size: $text-body-xs;
  color: var(--zen-text-muted);
  border-top: 1px solid var(--zen-border-light);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-4;
  margin-top: auto;
  transition: all 0.3s ease;

  .version {
    background: var(--zen-bg-secondary);
    padding: 2px 8px;
    border-radius: $radius-sm;
    transition: background 0.3s ease;
  }
}
</style>
