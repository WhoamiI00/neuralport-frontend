<template>
  <div class="sidebar-options">
    <!-- Header -->
    <div class="options-header">
      <span class="options-title">Options</span>
    </div>

    <!-- Options List -->
    <nav class="options-nav">
      <!-- Mobile-only options: Theme Toggle -->
      <button
        v-if="isMobile"
        class="option-item"
        @click="handleThemeToggle"
      >
        <i class="mdi" :class="isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"></i>
        <span class="option-label">{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
      </button>

      <!-- Divider for mobile -->
      <div v-if="isMobile" class="options-divider"></div>

      <!-- Superadmin Email Display (when in superadmin mode) -->
      <div
        v-if="isSuperadmin && superadminEmail"
        class="option-item vr-name-option non-clickable"
      >
        <i class="mdi mdi-shield-account"></i>
        <transition name="fade">
          <span class="option-label">
            <span class="vr-label">Superadmin</span>
            <span class="vr-value">{{ superadminEmail }}</span>
          </span>
        </transition>
      </div>

      <!-- VR Name Display (clickable/editable for admin only, hidden in superadmin mode) -->
      <button
        v-else-if="vrName"
        class="option-item vr-name-option"
        :class="{ 'non-clickable': !isAdmin }"
        @click="isAdmin ? handleEditVrName() : null"
      >
        <i class="mdi mdi-home-variant"></i>
        <transition name="fade">
          <span class="option-label">
            <span class="vr-label">VR Name</span>
            <span class="vr-value">{{ vrName }}</span>
            <span v-if="deviceId" class="device-id">ID: {{ deviceId }}</span>
          </span>
        </transition>
        <i v-if="isAdmin" class="mdi mdi-pencil edit-icon"></i>
      </button>

      <div v-if="(isSuperadmin && superadminEmail) || vrName" class="options-divider"></div>

      <!-- Admin-only: Manage Tags -->
      <button
        v-if="isAdmin && !isSuperadmin"
        class="option-item"
        @click="emit('manage-tags')"
      >
        <i class="mdi mdi-tag-multiple"></i>
        <transition name="fade">
          <span class="option-label">Manage Tags</span>
        </transition>
      </button>

      <div v-if="isAdmin && !isSuperadmin" class="options-divider"></div>

      <button
        v-for="option in options"
        :key="option.id"
        class="option-item"
        :class="{ 'active': activeOption === option.id }"
        @click="handleOptionClick(option)"
      >
        <i :class="option.icon"></i>
        <transition name="fade">
          <span class="option-label">{{ option.label }}</span>
        </transition>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../../composables/useTheme'

interface OptionItem {
  id: string
  label: string
  icon: string
  action?: () => void
}

interface Props {
  isAdmin?: boolean
  isSuperadmin?: boolean
  superadminEmail?: string
  vrName?: string
  deviceId?: string
}

withDefaults(defineProps<Props>(), {
  isAdmin: false,
  isSuperadmin: false,
  superadminEmail: '',
  vrName: '',
  deviceId: ''
})

const emit = defineEmits<{
  (e: 'option-click', option: OptionItem): void
  (e: 'theme-toggle'): void
  (e: 'edit-vr-name'): void
  (e: 'logout'): void
  (e: 'manage-tags'): void
}>()

const { isDark, toggleTheme } = useTheme()
const isMobile = ref(false)
const activeOption = ref<string | null>(null)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleThemeToggle = () => {
  toggleTheme()
  emit('theme-toggle')
}

const handleEditVrName = () => {
  emit('edit-vr-name')
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Sidebar options configuration
const options: OptionItem[] = [
  {
    id: 'multi-language',
    label: 'Multi-Language',
    icon: 'mdi mdi-translate'
  },
  {
    id: 'help',
    label: 'Help',
    icon: 'mdi mdi-help-circle-outline'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'mdi mdi-cog-outline'
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: 'mdi mdi-palette-outline'
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: 'mdi mdi-logout'
  }
]

const handleOptionClick = (option: OptionItem) => {
  activeOption.value = option.id
  if (option.id === 'logout') {
    emit('logout')
  } else {
    emit('option-click', option)
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.sidebar-options {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $space-3;
  min-height: 0; // Allow flex child to shrink and enable scrolling
  overflow-y: auto;
  overflow-x: hidden;
  
  // Custom scrollbar styling
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--zen-border-glass);
    border-radius: 3px;
    
    &:hover {
      background: var(--zen-text-muted);
    }
  }
}

.options-header {
  padding: $space-2 $space-3;
  margin-bottom: $space-2;
}

.options-title {
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  color: var(--zen-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.options-nav {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.option-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-lg;
  border: none;
  background: transparent;
  color: var(--zen-text-secondary);
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;

  i {
    font-size: 20px;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--zen-bg-secondary);
    color: var(--zen-text-primary);
  }

  &.active {
    background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.1));
    color: var(--zen-accent-teal);

    i {
      color: var(--zen-accent-teal);
    }
  }
}

.option-label {
  white-space: nowrap;
}

.vr-name-option {
  position: relative;
  
  .option-label {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    flex: 1;
  }

  .vr-label {
    font-size: $text-body-xs;
    color: var(--zen-text-muted);
  }

  .vr-value {
    font-size: $text-body-sm;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-primary);
  }

  .device-id {
    font-size: $text-body-xs;
    color: var(--zen-text-muted);
    opacity: 0.7;
    margin-top: 2px;
  }

  .edit-icon {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s ease;
    font-size: 18px;
  }

  &:hover .vr-value {
    color: var(--zen-accent-teal);
  }

  &:hover .edit-icon {
    opacity: 1;
  }

  &.non-clickable {
    cursor: default;
    
    &:hover {
      background: transparent;
      
      .vr-value {
        color: var(--zen-text-primary);
      }
    }
  }
}

.options-divider {
  height: 1px;
  background: var(--zen-border-glass);
  margin: $space-2 0;
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
