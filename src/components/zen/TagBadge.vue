<template>
  <span 
    class="tag-badge" 
    :style="{ 
      backgroundColor: getBackgroundColor(tag.color), 
      color: getTextColor(tag.color),
      borderColor: tag.color 
    }"
    :title="tag.description || tag.name"
  >
    <i v-if="icon" class="mdi" :class="icon"></i>
    <span class="tag-name">{{ tag.name }}</span>
    <button 
      v-if="removable" 
      class="remove-btn" 
      @click.stop="emit('remove', tag.id)"
      :title="`Remove ${tag.name}`"
    >
      <i class="mdi mdi-close"></i>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Tag } from '@/lib/api'

interface Props {
  tag: Tag
  removable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  removable: false
})

const emit = defineEmits<{
  (e: 'remove', tagId: number): void
}>()

// Get icon based on category
const icon = computed(() => {
  if (!props.tag.category) return null
  
  const categoryIcons: Record<string, string> = {
    team: 'mdi-account-group',
    location: 'mdi-map-marker',
    age_group: 'mdi-calendar',
    department: 'mdi-domain',
    skill_level: 'mdi-star',
    shift: 'mdi-clock-outline',
    custom: 'mdi-tag'
  }
  
  return categoryIcons[props.tag.category] || 'mdi-tag'
})

// Generate light background color from hex
function getBackgroundColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // Return RGBA with low opacity for background
  return `rgba(${r}, ${g}, ${b}, 0.15)`
}

// Get text color (use original color)
function getTextColor(hexColor: string): string {
  return hexColor
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: $radius-lg;
  font-size: $text-body-xs;
  font-weight: $font-weight-semibold;
  border: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.removable {
    padding-right: 8px;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
    }
  }

  i {
    font-size: 15px;
    opacity: 0.95;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }

  .tag-name {
    line-height: 1;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: 2px;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0.8;

    i {
      font-size: 15px;
    }

    &:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.2);
      transform: rotate(90deg) scale(1.1);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
