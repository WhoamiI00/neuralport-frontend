<template>
  <div class="std-deviation-card" :class="{ 'dark-mode': isDark }">
    <div class="card-header">
      <h4 class="card-title">Standard Deviation</h4>
      <el-tooltip
        content="Measures the variability in your fatigue scores. Lower values indicate more consistent performance."
        placement="top"
        :show-after="200"
      >
        <span class="info-icon">
          <i class="mdi mdi-information-outline"></i>
        </span>
      </el-tooltip>
    </div>
    <div class="content-wrapper">
      <!-- Left side: Value with ring -->
      <div class="value-section">
        <svg class="mini-ring" viewBox="0 0 80 80">
          <circle 
            class="ring-bg" 
            cx="40" 
            cy="40" 
            r="34" 
            fill="none" 
            stroke-width="6"
          />
          <circle 
            class="ring-progress" 
            cx="40" 
            cy="40" 
            r="34" 
            fill="none" 
            stroke-width="6"
            :stroke-dasharray="`${progressLength} ${circumference}`"
            stroke-linecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <span class="value">{{ value.toFixed(1) }}</span>
      </div>
      
      <!-- Right side: Trend sparkline -->
      <div class="trend-section">
        <svg class="trend-line" viewBox="0 0 100 40" preserveAspectRatio="none">
          <polyline 
            :points="trendPoints"
            fill="none"
            stroke="#8B5CF6"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="trend-label">Variability Trend</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  trendData?: number[]
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  trendData: () => [65, 72, 68, 75, 70, 78, 72, 80, 75, 72],
  isDark: false
})

const circumference = 2 * Math.PI * 34
const progressLength = computed(() => Math.min((props.value / 30) * circumference, circumference))

// Generate trend line points
const trendPoints = computed(() => {
  const data = props.trendData
  const width = 100
  const height = 40
  const padding = 4
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  return data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding
    const y = height - padding - ((val - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.std-deviation-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-left: none;
  border-right: none;
  border-radius: 0;
  padding: $space-4 $space-5;
  padding-bottom: $space-5;
  margin-bottom: $space-5;
  box-shadow: var(--zen-shadow-md);
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all $duration-normal $ease-out-expo;

  @media (max-width: $breakpoint-md) {
    padding: $space-3 $space-4;
    padding-bottom: $space-5;
    margin-bottom: $space-4;
    min-height: 140px;
  }

  @media (max-width: $breakpoint-sm) {
    padding: $space-3;
    padding-bottom: $space-5;
    margin-bottom: $space-4;
    min-height: 130px;
  }

  @media (min-width: $breakpoint-md) {
    border-left: 1px solid var(--zen-border-glass);
    border-right: 1px solid var(--zen-border-glass);
    border-radius: $radius-2xl;
    margin-bottom: 0;
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
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-2;

  @media (max-width: $breakpoint-sm) {
    gap: $space-1;
    margin-bottom: $space-1;
  }
}

.card-title {
  font-size: $text-body-sm;
  font-weight: $font-weight-medium;
  color: var(--zen-text-muted);
  margin: 0;

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

.content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;

  @media (max-width: $breakpoint-sm) {
    gap: $space-1;
  }
}

.value-section {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (max-width: $breakpoint-md) {
    width: 70px;
    height: 70px;
  }

  @media (max-width: $breakpoint-sm) {
    width: 60px;
    height: 60px;
  }

  .mini-ring {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .ring-bg {
    stroke: var(--zen-border-medium);
    transition: stroke 0.3s ease;
  }

  .ring-progress {
    stroke: #8B5CF6;
    transition: stroke-dasharray 1s ease-out;
  }

  .value {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    color: var(--zen-text-heading);
    z-index: 1;

    @media (max-width: $breakpoint-md) {
      font-size: 1.25rem;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 1rem;
    }
  }
}

.trend-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;

  .trend-line {
    width: 100%;
    max-width: 100px;
    height: 35px;

    @media (max-width: $breakpoint-sm) {
      max-width: 80px;
      height: 28px;
    }
  }

  .trend-label {
    font-size: 10px;
    color: var(--zen-text-muted);
    margin-top: 2px;

    @media (max-width: $breakpoint-sm) {
      font-size: 9px;
    }
  }
}
</style>
