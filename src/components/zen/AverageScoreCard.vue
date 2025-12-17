<template>
  <div class="average-score-card" :class="{ 'dark-mode': isDark }">
    <div class="card-header">
      <h4 class="card-title">Average Score</h4>
      <el-tooltip
        content="Your average fatigue score calculated over the last 30 days. This helps track your overall fatigue patterns."
        placement="top"
        :show-after="200"
      >
        <span class="info-icon">
          <i class="mdi mdi-information-outline"></i>
        </span>
      </el-tooltip>
    </div>
    <div class="gauge-wrapper">
      <svg class="gauge" viewBox="0 0 120 80">
        <!-- Background arc -->
        <path 
          class="gauge-bg"
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke-width="12"
          stroke-linecap="round"
        />
        <!-- Progress arc with gradient -->
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#67E8F9" />
            <stop offset="100%" stop-color="#06B6D4" />
          </linearGradient>
        </defs>
        <path 
          class="gauge-progress"
          :d="progressPath"
          fill="none"
          stroke="url(#gaugeGradient)"
          stroke-width="12"
          stroke-linecap="round"
        />
        <!-- Needle -->
        <g :transform="`rotate(${needleAngle} 60 70)`">
          <line 
            class="needle-line"
            x1="60" y1="70" 
            x2="60" y2="28"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle class="needle-dot" cx="60" cy="70" r="5" />
        </g>
      </svg>
      <div class="gauge-value">
        <span class="value">{{ score }}%</span>
        <span class="period">Last 30 Days</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score: number
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  score: 0,
  isDark: false
})

// Calculate needle angle (-90 to 90 degrees based on score)
const needleAngle = computed(() => {
  return -90 + (props.score / 100) * 180
})

// Calculate progress arc path
const progressPath = computed(() => {
  const percentage = props.score / 100
  const angle = percentage * 180
  const radians = (angle - 180) * (Math.PI / 180)
  const x = 60 + 50 * Math.cos(radians)
  const y = 70 + 50 * Math.sin(radians)
  const largeArc = angle > 180 ? 1 : 0
  
  return `M 10 70 A 50 50 0 ${largeArc} 1 ${x} ${y}`
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.average-score-card {
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
    border-radius: $radius-2xl;
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
  justify-content: center;
  gap: $space-2;
  margin-bottom: $space-1;

  @media (max-width: $breakpoint-sm) {
    gap: $space-1;
  }
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

.gauge-wrapper {
  position: relative;
  width: 140px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: $breakpoint-md) {
    width: 120px;
    height: 90px;
  }

  @media (max-width: $breakpoint-sm) {
    width: 110px;
    height: 80px;
  }
}

.gauge {
  width: 100%;
  height: 90px;

  @media (max-width: $breakpoint-md) {
    height: 80px;
  }

  @media (max-width: $breakpoint-sm) {
    height: 70px;
  }
}

.gauge-bg {
  stroke: var(--zen-border-medium);
  transition: stroke 0.3s ease;
}

.gauge-progress {
  transition: d 1s ease-out;
}

.needle-line {
  stroke: #1E293B;
  transition: stroke 0.3s ease;

  .dark-mode & {
    stroke: #F1F5F9;
  }
}

.needle-dot {
  fill: #1E293B;
  transition: fill 0.3s ease;

  .dark-mode & {
    fill: #F1F5F9;
  }
}

.gauge-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: $space-2;

  @media (max-width: $breakpoint-sm) {
    margin-top: $space-1;
  }

  .value {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    color: var(--zen-text-heading);
    line-height: 1;

    @media (max-width: $breakpoint-md) {
      font-size: 1.25rem;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: 1.125rem;
    }
  }

  .period {
    font-size: 10px;
    color: #06B6D4;
    margin-top: 4px;
    font-weight: $font-weight-medium;

    @media (max-width: $breakpoint-sm) {
      font-size: 9px;
      margin-top: 2px;
    }
  }
}
</style>
