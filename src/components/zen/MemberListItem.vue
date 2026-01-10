<template>
  <!-- Member List Item -->
  <div
    class="member-item"
    :class="{ 
      'active': isSelected
    }"
    @click="$emit('select', member)"
  >
    <!-- Avatar -->
    <div class="member-avatar">
      <img 
        v-if="member.avatarUrl && !imageError" 
        :src="member.avatarUrl" 
        :alt="member.name"
        @error="handleImageError"
      />
      <span v-else class="avatar-initials">{{ initials }}</span>
    </div>

    <!-- Name -->
    <transition name="fade">
      <div class="member-info">
        <!-- Performance Type Badge -->
        <div v-if="performanceType" class="performance-badge" :title="performanceType.description">
          <i class="mdi mdi-lightning-bolt"></i>
          <span>{{ performanceType.name }}</span>
        </div>
        <span class="member-name">{{ formatName(member.name) }}</span>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Member } from '../../data/members'
import type { PerformanceType } from '../../lib/api'
import { useNameFormat } from '../../composables/useNameFormat'

interface Props {
  member: Member
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})

// Name formatting based on language
const { formatName } = useNameFormat()

defineEmits<{
  (e: 'select', member: Member): void
}>()

// Fallback for broken images
const imageError = ref(false)

// Use performance type from member props (already included in user data)
const performanceType = computed<PerformanceType | null>(() => props.member?.performance_type || null)

const handleImageError = () => {
  imageError.value = true
}

// Compute initials from formatted name
const initials = computed(() => {
  const displayName = formatName.value(props.member.name)
  return displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.member-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: 1px solid transparent;
  margin-bottom: $space-1;

  &:hover {
    background: var(--zen-bg-secondary);
    border-color: var(--zen-border-light);
  }

  &.active {
    background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.1));
    border-color: var(--zen-accent-teal);

    .member-name {
      color: var(--zen-accent-teal);
    }
  }
}

.member-avatar {
  position: relative;
  flex-shrink: 0;

  img,
  .avatar-initials {
    width: 40px;
    height: 40px;
    border-radius: $radius-lg;
    object-fit: cover;
  }

  .avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--zen-accent-teal, #06B6D4), var(--zen-accent-peach, #FB923C));
    color: white;
    font-size: $text-body-sm;
    font-weight: $font-weight-bold;
  }
}

.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.performance-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 10px;
  background: linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(20, 184, 166, 0.3);
  width: fit-content;
  
  i {
    font-size: 10px;
  }
  
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }
}

.member-name {
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  color: var(--zen-text-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
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
