<template>
  <aside 
    class="zen-sidebar" 
    :class="{ 
      'mobile-open': mobileOpen,
      'dark-mode': isDark 
    }"
  >
    <!-- Mobile Backdrop -->
    <div 
      v-if="mobileOpen" 
      class="sidebar-backdrop" 
      @click="closeMobile"
    ></div>

    <!-- Sidebar Content -->
    <div class="sidebar-inner">
      <!-- Header with Logo & Hamburger -->
      <div class="sidebar-header">
        <!-- Hamburger toggles between Members/Options modes -->
        <button 
          class="hamburger-btn" 
          @click="toggleMode" 
          :title="sidebarMode === 'members' ? 'Switch to Options' : 'Switch to Members'"
        >
          <i class="mdi" :class="modeIcon"></i>
        </button>
        
        <transition name="fade">
          <div class="sidebar-logo">
            <!-- Dark logo for light mode, Light logo for dark mode -->
            <img 
              :src="logoSrc"
              alt="ZEN EYE PRO" 
              class="logo-image"
            />
          </div>
        </transition>



        <!-- Mobile Close -->
        <button v-if="mobileOpen" class="close-btn" @click="closeMobile">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <!-- Mode Indicator -->
      <!-- <transition name="fade">
        <div v-if="!isCollapsed" class="mode-indicator">
          <button 
            class="mode-tab"
            :class="{ 'active': sidebarMode === 'members' }"
            @click="sidebarMode = 'members'"
          >
            <i class="mdi mdi-account-group"></i>
            Members
          </button>
          <button 
            class="mode-tab"
            :class="{ 'active': sidebarMode === 'options' }"
            @click="sidebarMode = 'options'"
          >
            <i class="mdi mdi-cog"></i>
            Options
          </button>
        </div>
      </transition> -->

      <!-- Dynamic Content based on Mode -->
      <div class="sidebar-content">
        <!-- Superadmin Device Selector -->
        <div v-if="isSuperadmin" class="device-selector">
          <div class="device-header">
            <i class="mdi mdi-shield-account"></i>
            <span>Superadmin Mode</span>
          </div>
          
          <div class="device-list">
            <div 
              v-for="device in devices" 
              :key="device.id"
              class="device-item"
              :class="{ 'active': selectedDeviceId === device.id }"
              @click="emit('select-device', device.id)"
            >
              <i class="mdi mdi-virtual-reality"></i>
              <span class="device-name">{{ device.vr_name || device.device_id }}</span>
              <button 
                class="remove-device-btn" 
                @click.stop="emit('remove-device', device.id)"
                title="Remove device"
              >
                <i class="mdi mdi-close"></i>
              </button>
            </div>
            
            <button class="add-device-btn" @click="emit('add-device')">
              <i class="mdi mdi-plus"></i>
              <span>Add Device</span>
            </button>
          </div>
          
          <div class="device-divider"></div>
        </div>

        <transition name="slide-fade" mode="out-in">
          <!-- Members Mode -->
          <MemberList
            v-if="sidebarMode === 'members'"
            key="members"
            :members="members"
            :selected-member-id="selectedMemberId"
            :is-admin="isAdmin"
            @select-member="handleMemberSelect"
            @view-details="handleViewDetails"
            @create-user="handleCreateUser"
          />

          <!-- Options Mode -->
          <SidebarOptions
            v-else
            key="options"
            :is-admin="isAdmin"
            :is-superadmin="isSuperadmin"
            :superadmin-email="superadminEmail"
            :vr-name="vrName"
            :device-id="deviceId"
            @option-click="handleOptionClick"
            @edit-vr-name="handleEditVrName"
            @logout="handleLogout"
          />
        </transition>
      </div>
    </div>
  </aside>

  <!-- Mobile Toggle Button -->
  <button 
    v-if="!mobileOpen && isMobile" 
    class="mobile-toggle-btn"
    :class="{ 'dark-mode': isDark }"
    @click="openMobile"
  >
    <i class="mdi mdi-menu"></i>
  </button>
</template>

<script setup lang="ts">
/**
 * Sidebar.vue
 * 
 * Main sidebar component with two modes:
 * - Members mode: Shows scrollable member list with fatigue scores
 * - Options mode: Shows settings/options menu
 * 
 * The hamburger button toggles between these modes.
 * 
 * State flow:
 * - sidebarMode: 'members' | 'options' - controls which content is shown
 * - selectedMemberId: passed from parent, emitted when member is clicked
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../../composables/useTheme'
import { useAuthStore } from '../../stores/auth'
import { useSuperadminStore } from '../../stores/superadmin'
import type { Member } from '../../data/members'
import MemberList from './MemberList.vue'
import SidebarOptions from './SidebarOptions.vue'

interface Props {
  members: Member[]
  selectedMemberId?: string | null
  isAdmin?: boolean
  vrName?: string
  deviceId?: string
  // Superadmin props
  isSuperadmin?: boolean
  devices?: Array<{ id: number; device_id: string; vr_name?: string }>
  selectedDeviceId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedMemberId: null,
  isAdmin: false,
  vrName: '',
  deviceId: '',
  isSuperadmin: false,
  devices: () => [],
  selectedDeviceId: null
})

const emit = defineEmits<{
  (e: 'select-member', member: Member): void
  (e: 'deselect-member'): void
  (e: 'view-details', memberId: string): void
  (e: 'create-user', userData: { pin: string; username: string; avatar: File | null; avatarUrl: string | null }): void
  (e: 'edit-vr-name'): void
  // Superadmin events
  (e: 'select-device', deviceId: number): void
  (e: 'add-device'): void
  (e: 'remove-device', deviceId: number): void
  (e: 'superadmin-logout'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const { isDark } = useTheme()

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────

/**
 * Sidebar mode: 'members' shows member list, 'options' shows settings
 * Toggled by clicking the hamburger icon
 */
const sidebarMode = ref<'members' | 'options'>('members')

const mobileOpen = ref(false)
const isMobile = ref(false)

// ─────────────────────────────────────────────────────────────
// COMPUTED
// ─────────────────────────────────────────────────────────────

const superadminStore = useSuperadminStore()

// Get superadmin email from store
const superadminEmail = computed(() => {
  return superadminStore.superadmin?.email || ''
})

const modeIcon = computed(() => {
  return sidebarMode.value === 'members' 
    ? 'mdi-account-group-outline' 
    : 'mdi-cog-outline'
})

// Logo source - switches based on theme
const logoSrc = computed(() => {
  return !isDark.value 
    ? '/images/zen-logo-dark.png.png' 
    : '/images/zen-logo-light.png.png'
})

// ─────────────────────────────────────────────────────────────
// METHODS
// ─────────────────────────────────────────────────────────────

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    mobileOpen.value = false
  }
}

/**
 * Toggle between Members and Options mode
 */
const toggleMode = () => {
  sidebarMode.value = sidebarMode.value === 'members' ? 'options' : 'members'
}



const openMobile = () => {
  mobileOpen.value = true
}

const closeMobile = () => {
  mobileOpen.value = false
}

/**
 * Handle member selection
 * Emits to parent so dashboard can show member summary layer
 */
const handleMemberSelect = (member: Member) => {
  emit('select-member', member)
  if (isMobile.value) {
    closeMobile()
  }
}

/**
 * Handle view details click
 * Emits to parent so it can navigate to member details page
 */
const handleViewDetails = (memberId: string) => {
  emit('view-details', memberId)
  if (isMobile.value) {
    closeMobile()
  }
}

/**
 * Handle create user event from MemberList
 * Emits to parent so it can call API to create the user
 */
const handleCreateUser = (userData: { pin: string; username: string; avatar: File | null; avatarUrl: string | null }) => {
  emit('create-user', userData)
}

const handleOptionClick = (option: { id: string; label: string }) => {
  // Handle different options
  switch (option.id) {
    case 'themes':
      // Could toggle theme or show theme picker
      break
    case 'settings':
      // Navigate to settings or show modal
      break
    case 'help':
      // Show help dialog
      break
    case 'multi-language':
      // Show language picker
      break
  }
  
  if (isMobile.value) {
    closeMobile()
  }
}

const handleEditVrName = () => {
  emit('edit-vr-name')
  if (isMobile.value) {
    closeMobile()
  }
}

const handleLogout = async () => {
  // Check if superadmin mode, use appropriate logout
  if (props.isSuperadmin || superadminStore.isAuthenticated) {
    await superadminStore.logout()
  } else {
    await authStore.signOut()
  }
  router.push('/login')
}

// ─────────────────────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────────────────────

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.zen-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 280px;
  background: var(--zen-surface);
  border-right: 1px solid var(--zen-border-glass);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: width 0.3s ease, transform 0.3s ease, background 0.3s ease;

  @media (max-width: 767px) {
    transform: translateX(-100%);
    width: 300px;
    box-shadow: none;
    background: #ffffff;

    &.mobile-open {
      transform: translateX(0);
      box-shadow: var(--zen-shadow-2xl);
    }

    &.dark-mode {
      background: #1a1a2e;
    }
  }
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  // background: rgba(0, 0, 0, 0.5);
  z-index: -1;

  @media (min-width: 768px) {
    display: none;
  }
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────

.sidebar-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border-bottom: 1px solid var(--zen-border-light);
  min-height: 64px;
}

.hamburger-btn {
  width: 40px;
  height: 40px;
  border-radius: $radius-lg;
  border: none;
  background: var(--zen-bg-secondary);
  color: var(--zen-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  i {
    font-size: 22px;
  }

  &:hover {
    background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.15));
    color: var(--zen-accent-teal);
  }
}

.close-btn {
  margin-left: auto;
  width: 36px;
  height: 36px;
  border-radius: $radius-md;
  border: none;
  background: transparent;
  color: var(--zen-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--zen-bg-secondary);
    color: var(--zen-text-primary);
  }

  @media (min-width: 768px) {
    display: none;
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: $space-1 0;

  .logo-image {
    height: 32px;
    width: auto;
    object-fit: contain;
    transition: opacity 0.3s ease;
  }
}

// ─────────────────────────────────────────────────────────────
// MODE INDICATOR / TABS
// ─────────────────────────────────────────────────────────────

.mode-indicator {
  display: flex;
  gap: $space-1;
  padding: $space-3;
  border-bottom: 1px solid var(--zen-border-light);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  border: none;
  background: transparent;
  color: var(--zen-text-muted);
  font-size: $text-body-xs;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 16px;
  }

  &:hover {
    background: var(--zen-bg-secondary);
    color: var(--zen-text-primary);
  }

  &.active {
    background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.15));
    color: var(--zen-accent-teal);
  }
}

// ─────────────────────────────────────────────────────────────
// CONTENT AREA
// ─────────────────────────────────────────────────────────────

.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────

.sidebar-footer {
  padding: $space-3;
  border-top: 1px solid var(--zen-border-light);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.admin-card {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--zen-bg-secondary);
  border-radius: $radius-lg;
  transition: all 0.2s ease;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #667EEA, #764BA2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 20px;
    color: white;
  }
}

.admin-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-name {
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  color: var(--zen-text-heading);
}

.admin-role {
  font-size: $text-body-xs;
  color: var(--zen-text-muted);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  width: 100%;
  padding: $space-3;
  border: none;
  border-radius: $radius-lg;
  background: transparent;
  color: var(--zen-text-secondary);
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 18px;
  }

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--zen-accent-danger);
  }
}

// ─────────────────────────────────────────────────────────────
// MOBILE TOGGLE
// ─────────────────────────────────────────────────────────────

.mobile-toggle-btn {
  position: fixed;
  top: $space-4;
  left: $space-4;
  width: 44px;
  height: 44px;
  border-radius: $radius-lg;
  border: none;
  background: var(--zen-surface);
  color: var(--zen-text-primary);
  box-shadow: var(--zen-shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: all 0.2s ease;

  i {
    font-size: 24px;
  }

  &:hover {
    background: var(--zen-accent-teal);
    color: white;
  }
}

// ─────────────────────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────────────────────

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

// ─────────────────────────────────────────────────────────────
// SUPERADMIN DEVICE SELECTOR
// ─────────────────────────────────────────────────────────────

.device-selector {
  padding: 0 $space-4;
  margin-bottom: $space-4;
}

.device-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  margin-bottom: $space-3;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: $radius-lg;
  color: white;
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;

  i {
    font-size: 18px;
  }
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.device-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--zen-bg-secondary);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  i {
    font-size: 20px;
    color: var(--zen-text-muted);
  }

  .device-name {
    flex: 1;
    font-size: $text-body-sm;
    color: var(--zen-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remove-device-btn {
    opacity: 0;
    background: none;
    border: none;
    padding: $space-1;
    cursor: pointer;
    color: var(--zen-text-muted);
    transition: all 0.2s ease;

    &:hover {
      color: var(--zen-accent-danger);
    }
  }

  &:hover {
    background: var(--zen-bg-tertiary);

    .remove-device-btn {
      opacity: 1;
    }
  }

  &.active {
    background: rgba(var(--zen-accent-teal-rgb), 0.15);
    border-left: 3px solid var(--zen-accent-teal);

    i {
      color: var(--zen-accent-teal);
    }

    .device-name {
      color: var(--zen-text-heading);
      font-weight: $font-weight-medium;
    }
  }
}

.add-device-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3;
  background: transparent;
  border: 2px dashed var(--zen-border);
  border-radius: $radius-lg;
  color: var(--zen-text-muted);
  font-size: $text-body-sm;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--zen-accent-teal);
    color: var(--zen-accent-teal);
    background: rgba(var(--zen-accent-teal-rgb), 0.05);
  }
}

.device-divider {
  height: 1px;
  background: var(--zen-border);
  margin-top: $space-4;
}
</style>
