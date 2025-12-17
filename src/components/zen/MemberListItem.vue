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
        <span class="member-name">{{ member.name }}</span>
      </div>
    </transition>

    <!-- Navigation Icon -->
    <transition name="fade">
      <button 
        class="nav-icon-btn"
        @click.stop="$emit('view-details', member.id)"
        title="View details"
      >
        <i class="mdi mdi-chevron-right"></i>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Member } from '../../data/members'

interface Props {
  member: Member
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})

defineEmits<{
  (e: 'select', member: Member): void
  (e: 'view-details', memberId: string): void
}>()

// Fallback for broken images
const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

// Compute initials from name
const initials = computed(() => {
  return props.member.name
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
  align-items: center;
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

.nav-icon-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: $radius-md;
  border: none;
  background: transparent;
  color: var(--zen-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  i {
    font-size: 20px;
  }

  &:hover {
    background: var(--zen-bg-secondary);
    color: var(--zen-accent-teal);
  }
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
