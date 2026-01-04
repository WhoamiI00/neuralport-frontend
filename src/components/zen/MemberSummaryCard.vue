<template>
  <div class="member-summary-card" :class="{ 'dark-mode': isDark }">
    <!-- Close Button -->
    <button class="close-btn" @click="$emit('close')" title="Close">
      <i class="mdi mdi-close"></i>
    </button>

    <!-- Edit Button -->
    <button class="edit-btn" @click="openEditModal" title="Edit Member">
      <i class="mdi mdi-pencil"></i>
    </button>

    <!-- Main Content: Horizontal Table Layout -->
    <div class="card-row">
      <!-- Profile Column -->
      <div class="profile-col">
        <div class="avatar">
          <img 
            v-if="member.avatarUrl" 
            :src="member.avatarUrl" 
            :alt="member.name"
          />
          <span v-else class="initials">{{ initials }}</span>
        </div>
        <div class="info">
          <h2 class="name">{{ member.name }}</h2>
          <p class="pin" v-if="member.pin">PIN: {{ member.pin }}</p>
          <p class="sessions">{{ formattedSessions }}</p>
          
          <!-- Tag Selector - readonly for regular users, editable for admins -->
          <div class="tags-section">
            <TagSelector 
              :user-id="parseInt(member.id)" 
              :model-value="member.tags || []"
              :readonly="!isAdmin && !isSuperadmin"
              @tags-updated="handleTagsUpdated"
            />
          </div>
        </div>
      </div>

      <!-- Metrics Container with Dividers -->
      <div class="metrics-container">
        <!-- Latest Column -->
        <div class="metric-col latest">
          <div class="metric-header">
            <i class="mdi mdi-calendar-clock metric-icon"></i>
            <span class="col-header">{{ t('dashboard.latest') }}</span>
          </div>
          <div class="col-body">
            <span class="sub-text">{{ latestDateFormatted }}</span>
            <span class="main-value" :class="{ 'na-value': isNewUser }">{{ formattedLatestScore }}</span>
          </div>
        </div>

        <!-- Vertical Divider -->
        <div class="metric-divider"></div>

        <!-- Average Column -->
        <div class="metric-col average">
          <div class="metric-header">
            <i class="mdi mdi-chart-bar metric-icon"></i>
            <span class="col-header">{{ t('dashboard.average') }}</span>
          </div>
          <div class="col-body">
            <span class="main-value highlight" :class="{ 'na-value': isNewUser }">{{ formattedAverageScore }}</span>
          </div>
        </div>

        <!-- Vertical Divider -->
        <div class="metric-divider"></div>

        <!-- Standard Deviation Column - Enhanced -->
        <div class="metric-col std-deviation">
          <div class="metric-header">
            <i class="mdi mdi-chart-bell-curve-cumulative metric-icon"></i>
            <span class="col-header">{{ t('dashboard.standardDeviation') }}</span>
          </div>
          <div class="col-body">
            <div class="std-dev-display" :class="{ 'na-display': isNewUser }">
              <span class="std-dev-value">{{ formattedStdDeviation }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Arrow -->
      <button class="details-arrow" @click="$emit('view-details', member.id)" title="View Details">
        <i class="mdi mdi-chevron-right"></i>
      </button>
    </div>

    <!-- Edit Member Modal -->
    <EditMemberModal
      v-model="showEditModal"
      :member="member"
      @update-member="handleUpdateMember"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Member } from '../../data/members'
import type { MemberSummary } from '../../data/memberDashboards'
import { useTheme } from '../../composables/useTheme'
import { useLanguage } from '../../composables/useLanguage'
import EditMemberModal from './EditMemberModal.vue'
import TagSelector from './TagSelector.vue'

interface Props {
  member: Member
  summary: MemberSummary & { latestScoreDate?: string | null }
  isSuperadmin?: boolean
  isAdmin?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'view-details', memberId: string): void
  (e: 'update-member', memberData: { id: string; username: string; avatar: File | null; avatarUrl: string | null }): void
  (e: 'tags-updated'): void
}>()

const { isDark } = useTheme()
const { t } = useLanguage()

// Access props for admin/superadmin status
const isAdmin = computed(() => props.isAdmin === true)
const isSuperadmin = computed(() => props.isSuperadmin === true)

// Edit modal state
const showEditModal = ref(false)

const openEditModal = () => {
  showEditModal.value = true
}

const handleUpdateMember = (memberData: { id: string; username: string; avatar: File | null; avatarUrl: string | null }) => {
  emit('update-member', memberData)
}

const handleTagsUpdated = () => {
  emit('tags-updated')
}

// Check if this is a new user with no data
const isNewUser = computed(() => {
  return props.summary.totalSessions === 0
})

// Compute initials from name
const initials = computed(() => {
  return props.member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
})

// Formatted values with N/A for new users
const formattedLatestScore = computed(() => {
  return isNewUser.value ? 'N/A' : Math.round(props.summary.latestFatigueScore)
})

const formattedAverageScore = computed(() => {
  return isNewUser.value ? 'N/A' : props.summary.averageScore.toFixed(2)
})

const formattedStdDeviation = computed(() => {
  return isNewUser.value ? 'N/A' : props.summary.standardDeviation.toFixed(2)
})

const formattedSessions = computed(() => {
  const count = isNewUser.value ? 0 : (props.summary.totalSessions || 0)
  const sessionText = count === 1 ? 'Session' : 'Sessions'
  return `${count} ${sessionText}`
})

// Latest date formatted from actual latest score timestamp
const latestDateFormatted = computed(() => {
  if (isNewUser.value || !props.summary.latestScoreDate) {
    return 'No sessions\nrecorded yet'
  }
  
  try {
    const date = new Date(props.summary.latestScoreDate)
    if (isNaN(date.getTime())) {
      return 'Latest\nScore'
    }
    
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    
    return `${year}/${month}/${day}\n${hours}:${minutes}:${seconds}`
  } catch (e) {
    return 'Latest\nScore'
  }
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.member-summary-card {
  position: relative;
  background: var(--zen-surface);
  border: 1px solid var(--zen-border-glass);
  border-radius: 16px;
  @media (max-width: 767px) {
  border-radius: 0px;
  }
  padding: 32px 40px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

// ─────────────────────────────────────────────────────────────
// CLOSE BUTTON
// ─────────────────────────────────────────────────────────────

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--zen-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  i {
    font-size: 20px;
  }

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }
}

.edit-btn {
  position: absolute;
  top: 16px;
  right: 56px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--zen-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  i {
    font-size: 20px;
  }

  &:hover {
    background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.15));
    color: var(--zen-accent-teal);
  }
}

// ─────────────────────────────────────────────────────────────
// CARD ROW - HORIZONTAL TABLE LAYOUT
// ─────────────────────────────────────────────────────────────

.card-row {
  display: flex;
  align-items: stretch;
  gap: 0;

  @media (max-width: 900px) {
    flex-wrap: wrap;
    gap: 24px;
  }
}

// ─────────────────────────────────────────────────────────────
// PROFILE COLUMN
// ─────────────────────────────────────────────────────────────

.profile-col {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-right: 32px;
  border-right: 1px solid var(--zen-border-glass);
  min-width: 240px;

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid var(--zen-border-glass);
    padding-right: 0;
    padding-bottom: 24px;
    width: 100%;
  }
}

.avatar {
  flex-shrink: 0;

  img,
  .initials {
    width: 140px;
    height: 140px;
    border-radius: 16px;
    object-fit: cover;
    display: block;
  }

  .initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%);
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
  }
}

.info {
  .name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--zen-text-heading);
    margin: 0 0 8px;
    transition: color 0.3s ease;
  }

  .pin {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--zen-accent-primary);
    margin: 0 0 8px;
    letter-spacing: 1px;
    opacity: 0.9;
  }

  .sessions {
    font-size: 2rem;
    font-weight: 700;
    color: var(--zen-text-muted);
    margin: 0;
    opacity: 0.7;
    transition: color 0.3s ease;
  }
  
  .tags-section {
    margin-top: 12px;
  }
}

// ─────────────────────────────────────────────────────────────
// METRICS CONTAINER
// ─────────────────────────────────────────────────────────────

.metrics-container {
  display: flex;
  align-items: stretch;
  flex: 1;
  padding: 0 16px;

  @media (max-width: 900px) {
    padding: 0;
    flex-wrap: wrap;
    gap: 16px;
  }
}

.metric-divider {
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--zen-border-glass) 20%,
    var(--zen-border-glass) 80%,
    transparent 100%
  );
  margin: 8px 0;

  @media (max-width: 900px) {
    display: none;
  }
}

// ─────────────────────────────────────────────────────────────
// METRIC COLUMNS
// ─────────────────────────────────────────────────────────────

.metric-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 28px;
  min-width: 130px;
  transition: all 0.3s ease;

  @media (max-width: 900px) {
    flex: 1;
    padding: 12px 16px;
    min-width: 120px;
    background: var(--zen-bg-secondary);
    border-radius: 12px;
  }
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-icon {
  font-size: 18px;
  color: var(--zen-text-muted);
  opacity: 0.7;
  transition: color 0.3s ease;
}

.col-header {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--zen-text-muted);
  text-align: center;
  line-height: 1.3;
  transition: color 0.3s ease;
}

.col-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sub-text {
  font-size: 0.8rem;
  color: var(--zen-text-muted);
  text-align: center;
  white-space: pre-line;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.main-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--zen-text-heading);
  line-height: 1;
  transition: color 0.3s ease;

  &.highlight {
    color: #64748B;
    
    .dark-mode & {
      color: #94A3B8;
    }
  }

  &.na-value {
    color: var(--zen-text-muted);
    font-size: 1.5rem;
    opacity: 0.7;
  }
}

// ─────────────────────────────────────────────────────────────
// STANDARD DEVIATION - ENHANCED STYLING
// ─────────────────────────────────────────────────────────────

.std-deviation {
  .metric-icon {
    color: #8B5CF6;
    opacity: 1;
  }

  .col-header {
    color: #7C3AED;
    font-weight: 600;
    
    .dark-mode & {
      color: #A78BFA;
    }
  }
}

.std-dev-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  
  .dark-mode & {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
    border-color: rgba(139, 92, 246, 0.3);
  }

  &.na-display {
    background: var(--zen-bg-secondary);
    border-color: var(--zen-border-light);

    .std-dev-value {
      color: var(--zen-text-muted);
      font-size: 1.5rem;
      opacity: 0.7;
    }
  }
}

.std-dev-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #6D28D9;
  line-height: 1;
  letter-spacing: -0.02em;
  
  .dark-mode & {
    color: #C4B5FD;
  }
}

// ─────────────────────────────────────────────────────────────
// LATEST METRIC STYLING
// ─────────────────────────────────────────────────────────────

.latest {
  .metric-icon {
    color: #06B6D4;
  }
}

// ─────────────────────────────────────────────────────────────
// AVERAGE METRIC STYLING
// ─────────────────────────────────────────────────────────────

.average {
  .metric-icon {
    color: #10B981;
  }
}

// ─────────────────────────────────────────────────────────────
// DETAILS ARROW BUTTON
// ─────────────────────────────────────────────────────────────

.details-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--zen-border-glass);
  background: transparent;
  color: var(--zen-text-muted);
  cursor: pointer;
  transition: all 0.25s ease;
  margin-left: 20px;
  flex-shrink: 0;
  align-self: center;

  i {
    font-size: 28px;
    transition: transform 0.25s ease;
  }

  &:hover {
    background: linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%);
    border-color: transparent;
    color: white;
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(20, 184, 166, 0.4);
    
    i {
      transform: translateX(2px);
    }
  }

  @media (max-width: 900px) {
    margin-left: 16px;
    width: 40px;
    height: 40px;

    i {
      font-size: 24px;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// FOOTER (Legacy - kept for compatibility)
// ─────────────────────────────────────────────────────────────

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
}

.details-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);

  i {
    font-size: 18px;
    transition: transform 0.25s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(20, 184, 166, 0.4);
    
    i {
      transform: translateX(4px);
    }
  }
}
</style>
