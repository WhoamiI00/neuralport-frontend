<template>
    <button 
        class="theme-toggle" 
        @click="toggleTheme" 
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
        <Transition name="icon-flip" mode="out-in">
            <!-- Sun Icon (shown in dark mode) -->
            <svg v-if="isDark" key="sun" class="toggle-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <!-- Moon Icon (shown in light mode) -->
            <svg v-else key="moon" class="toggle-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        </Transition>
    </button>
</template>

<script setup lang="ts">
import { useTheme } from '../../composables/useTheme'

// Props
const props = withDefaults(defineProps<{
    position?: 'fixed' | 'relative'
}>(), {
    position: 'relative'
})

// Emits
const emit = defineEmits<{
    (e: 'toggle'): void
}>()

// Use shared theme state
const { isDark, toggleTheme: doToggle } = useTheme()

// Wrap toggle to also emit event
function toggleTheme() {
    doToggle()
    emit('toggle')
}

// Expose for parent components
defineExpose({ isDark, toggleTheme })
</script>

<style lang="scss" scoped>
.theme-toggle {
    position: v-bind("props.position === 'relative' ? 'relative' : 'fixed'");
    top: v-bind("props.position === 'relative' ? 'auto' : '20px'");
    right: v-bind("props.position === 'relative' ? 'auto' : '20px'");
    z-index: 1000;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid var(--zen-border-glass);
    background: var(--zen-surface-glass);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--zen-shadow-md);

    &:hover {
        transform: scale(1.1) rotate(15deg);
        background: var(--zen-surface);
        border-color: var(--zen-accent-teal);
        box-shadow: var(--zen-shadow-lg), 0 0 15px var(--zen-block-glow);
    }

    &:active {
        transform: scale(1.05) rotate(15deg);
    }

    .toggle-icon {
        width: 22px;
        height: 22px;
        transition: color 0.3s ease;
    }

    .sun-icon {
        color: #fbbf24;
    }

    .moon-icon {
        color: var(--zen-text-primary);
    }
}

// Icon Flip Transition
.icon-flip-enter-active,
.icon-flip-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-flip-enter-from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.5);
}

.icon-flip-leave-to {
    opacity: 0;
    transform: rotate(90deg) scale(0.5);
}

// Responsive sizing
@media (max-width: 768px) {
    .theme-toggle {
        top: v-bind("props.position === 'relative' ? 'auto' : '16px'");
        right: v-bind("props.position === 'relative' ? 'auto' : '16px'");
        width: 40px;
        height: 40px;

        .toggle-icon {
            width: 20px;
            height: 20px;
        }
    }
}

@media (max-width: 480px) {
    .theme-toggle {
        width: 36px;
        height: 36px;

        .toggle-icon {
            width: 18px;
            height: 18px;
        }
    }
}
</style>
