<template>
  <div class="fatigue-score-card" :class="{ 'dark-mode': isDark }">
    <div class="card-header">
      <div class="title-row">
        <h4 class="card-title">Latest Fatigue Score</h4>
        <el-tooltip
          content="The most recent fatigue level measured during your last session. Higher scores indicate greater fatigue levels (0-100 scale)."
          placement="top"
          :show-after="200"
        >
          <span class="info-icon">
            <i class="mdi mdi-information-outline"></i>
          </span>
        </el-tooltip>
      </div>
      <span v-if="latestDate" class="latest-date">{{ formattedDate }}</span>
    </div>
    <div class="score-ring-wrapper">
      <svg class="score-ring" viewBox="0 0 120 120">
        <!-- Background ring -->
        <circle 
          class="ring-bg" 
          cx="60" 
          cy="60" 
          r="50" 
          fill="none" 
          stroke-width="10"
        />
        <!-- Progress ring -->
        <circle 
          class="ring-progress" 
          cx="60" 
          cy="60" 
          r="50" 
          fill="none" 
          stroke-width="10"
          :stroke-dasharray="`${progressLength} ${circumference}`"
          stroke-linecap="round"
          transform="rotate(-90 60 60)"
        />
        <!-- Dot at end of progress -->
        <circle 
          class="ring-dot"
          :cx="dotPosition.x"
          :cy="dotPosition.y"
          r="6"
        />
        <!-- Score text - centered using SVG text anchor -->
        <text 
          class="score-text" 
          x="60" 
          y="56" 
          text-anchor="middle" 
          dominant-baseline="middle"
          font-size="32"
          font-weight="700"
        >{{ score }}</text>
        <text 
          class="max-text" 
          x="60" 
          y="72" 
          text-anchor="middle" 
          dominant-baseline="middle"
          font-size="11"
          font-weight="400"
        >/ 100</text>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score: number
  isDark?: boolean
  latestDate?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  score: 0,
  isDark: false,
  latestDate: null
})

// Format the date for display
const formattedDate = computed(() => {
  if (!props.latestDate) return ''
  const date = new Date(props.latestDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}/${month}/${day}`
})

const circumference = 2 * Math.PI * 50
const progressLength = computed(() => (props.score / 100) * circumference)

// Calculate dot position at end of progress arc
const dotPosition = computed(() => {
  const angle = ((props.score / 100) * 360 - 90) * (Math.PI / 180)
  return {
    x: 60 + 50 * Math.cos(angle),
    y: 60 + 50 * Math.sin(angle)
  }
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.fatigue-score-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-left: none;
  border-right: none;
  border-radius: 0;
  padding: $space-4 $space-5;
  box-shadow: var(--zen-shadow-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  transition: all $duration-normal $ease-out-expo;

  @media (max-width: $breakpoint-md) {
    padding: $space-3 $space-4;
    min-height: 140px;
  }

  @media (max-width: $breakpoint-sm) {
    padding: $space-3;
    min-height: 130px;
  }

  @media (min-width: $breakpoint-md) {
    border-left: 1px solid var(--zen-border-glass);
    border-right: 1px solid var(--zen-border-glass);
    border-radius: 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--zen-shadow-xl);

    @media (max-width: $breakpoint-md) {
      transform: none;
    }
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  margin-bottom: $space-2;

  @media (max-width: $breakpoint-sm) {
    gap: $space-1;
    margin-bottom: $space-1;
  }
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
}

.latest-date {
  font-size: $text-body-xs;
  color: var(--zen-accent-teal);
  font-weight: $font-weight-medium;
}

.card-title {
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  color: var(--zen-text-muted);
  margin: 0;
  text-align: center;

  @media (max-width: $breakpoint-sm) {
    font-size: $text-body-xs;
  }
}

.info-icon {
  color: var(--zen-text-disabled);
  cursor: help;
  font-size: 14px;
  transition: color 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: $breakpoint-sm) {
    font-size: 12px;
    min-width: 36px;
    min-height: 36px;
  }

  &:hover {
    color: var(--zen-accent-teal);
  }
}

.score-ring-wrapper {
  position: relative;
  width: 110px;
  height: 110px;

  @media (max-width: $breakpoint-md) {
    width: 100px;
    height: 100px;
  }

  @media (max-width: $breakpoint-sm) {
    width: 90px;
    height: 90px;
  }
}

.score-ring {
  width: 100%;
  height: 100%;
  display: block;
}

.ring-bg {
  stroke: var(--zen-border-medium);
  transition: stroke 0.3s ease;
}

.ring-progress {
  stroke: #3B82F6;
  transition: stroke-dasharray 1s ease-out;
}

.ring-dot {
  fill: #3B82F6;
}

.score-text {
  fill: var(--zen-text-heading);
  transition: fill 0.3s ease;
  user-select: none;
  pointer-events: none;

  @media (max-width: $breakpoint-md) {
    font-size: 28px;
    y: 56px;
  }

  @media (max-width: $breakpoint-sm) {
    font-size: 24px;
    y: 56px;
  }
}

.max-text {
  fill: var(--zen-text-muted);
  transition: fill 0.3s ease;
  user-select: none;
  pointer-events: none;

  @media (max-width: $breakpoint-sm) {
    font-size: 10px;
  }
}
</style>
