<template>
  <div class="zen-chart-card" :class="{ 'zen-chart-card-large': large }">
    <div v-if="title" class="zen-chart-header">
      <div class="zen-chart-title-group">
        <h3 class="zen-chart-title">{{ title }}</h3>
        <p v-if="subtitle" class="zen-chart-subtitle">{{ subtitle }}</p>
      </div>
      <slot name="controls"></slot>
    </div>
    <div class="zen-chart-body" :class="{ 'zen-chart-body-large': large, 'zen-chart-body-no-header': !title }">
      <div ref="chartRef" class="zen-chart-canvas"></div>
      <slot name="legend"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface Props {
  title?: string
  subtitle?: string
  options?: EChartsOption
  option?: EChartsOption
  large?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  large: false
})

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// Use either options or option prop
const chartOptions = computed(() => props.options || props.option || {})

const initChart = () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(chartOptions.value)
  }
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(chartOptions, (newOptions) => {
  chartInstance?.setOption(newOptions, true)
}, { deep: true })

onMounted(() => {
  setTimeout(() => {
    initChart()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.zen-chart-card {
  background: var(--zen-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--zen-border-glass);
  border-radius: $radius-xl;
  padding: $space-8;
  box-shadow: var(--zen-shadow-lg);
  height: 400px;
  transition: background 0.3s ease, border-color 0.3s ease;
  
  &.zen-chart-card-large {
    height: 500px;
  }
  
  @media (max-width: $breakpoint-md) {
    padding: $space-6;
    height: 350px;
    border-radius: $radius-lg;
    
    &.zen-chart-card-large {
      height: 400px;
    }
  }

  @media (max-width: $breakpoint-sm) {
    padding: $space-4;
    height: 300px;
    border-radius: $radius-md;
    
    &.zen-chart-card-large {
      height: 340px;
    }
  }

  @media (max-width: 375px) {
    padding: $space-3;
    height: 260px;
    
    &.zen-chart-card-large {
      height: 300px;
    }
  }
}

.zen-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-6;
  
  @media (max-width: $breakpoint-md) {
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-4;
  }

  @media (max-width: $breakpoint-sm) {
    gap: $space-3;
    margin-bottom: $space-3;
  }
}

.zen-chart-title-group {
  .zen-chart-title {
    font-size: $text-heading-3;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-heading);
    margin: 0;
    transition: color 0.3s ease;

    @media (max-width: $breakpoint-md) {
      font-size: $text-title-sm;
    }

    @media (max-width: $breakpoint-sm) {
      font-size: $text-body-lg;
    }
  }
  
  .zen-chart-subtitle {
    font-size: $text-body-sm;
    color: var(--zen-text-muted);
    margin: $space-1 0 0 0;
    transition: color 0.3s ease;

    @media (max-width: $breakpoint-sm) {
      font-size: $text-body-xs;
    }
  }
}

.zen-chart-body {
  height: calc(100% - 80px);
  position: relative;
  
  &.zen-chart-body-large {
    height: calc(100% - 60px);
  }
  
  &.zen-chart-body-no-header {
    height: 100%;
  }

  @media (max-width: $breakpoint-md) {
    height: calc(100% - 70px);
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;

    &.zen-chart-body-large {
      height: calc(100% - 50px);
    }
  }

  @media (max-width: $breakpoint-sm) {
    height: calc(100% - 60px);

    &.zen-chart-body-large {
      height: calc(100% - 40px);
    }
  }
}

.zen-chart-canvas {
  width: 100%;
  height: 100%;

  @media (max-width: $breakpoint-md) {
    min-width: 500px;
  }

  @media (max-width: $breakpoint-sm) {
    min-width: 450px;
  }
}
</style>
