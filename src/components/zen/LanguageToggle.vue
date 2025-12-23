<template>
    <button 
        class="language-toggle" 
        @click="toggleLanguage" 
        :aria-label="`Switch to ${currentLanguage === 'en' ? 'Japanese' : 'English'}`"
        :title="`Switch to ${currentLanguage === 'en' ? 'Japanese' : 'English'}`"
    >
        <Transition name="lang-flip" mode="out-in">
            <!-- EN Flag/Icon (shown when Japanese is active) -->
            <span v-if="currentLanguage === 'ja'" key="en" class="language-icon">
                EN
            </span>
            <!-- JA Flag/Icon (shown when English is active) -->
            <span v-else key="ja" class="language-icon">
                JA
            </span>
        </Transition>
    </button>
</template>

<script setup lang="ts">
import { useLanguage } from '../../composables/useLanguage'

// Props
const props = withDefaults(defineProps<{
    position?: 'fixed' | 'relative'
}>(), {
    position: 'relative'
})

// Emits
const emit = defineEmits<{
    (e: 'toggle', language: string): void
}>()

// Language management
const { currentLanguage, toggleLanguage: toggle } = useLanguage()

// Toggle language
function toggleLanguage() {
    toggle()
    emit('toggle', currentLanguage.value)
}

// Expose for parent components
defineExpose({ currentLanguage, toggleLanguage })
</script>

<style lang="scss" scoped>
.language-toggle {
    position: v-bind("props.position === 'relative' ? 'relative' : 'fixed'");
    top: v-bind("props.position === 'relative' ? 'auto' : '20px'");
    right: v-bind("props.position === 'relative' ? 'auto' : '70px'");
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
        transform: scale(1.1);
        background: var(--zen-surface);
        border-color: var(--zen-accent-teal);
        box-shadow: var(--zen-shadow-lg), 0 0 15px var(--zen-block-glow);
    }

    &:active {
        transform: scale(1.05);
    }

    .language-icon {
        font-size: 12px;
        font-weight: 700;
        color: var(--zen-text-primary);
        letter-spacing: 0.5px;
        transition: color 0.3s ease;
    }
}

// Language Flip Transition
.lang-flip-enter-active,
.lang-flip-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.lang-flip-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.8);
}

.lang-flip-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
}

// Responsive sizing
@media (max-width: 768px) {
    .language-toggle {
        top: v-bind("props.position === 'relative' ? 'auto' : '16px'");
        right: v-bind("props.position === 'relative' ? 'auto' : '64px'");
        width: 40px;
        height: 40px;

        .language-icon {
            font-size: 11px;
        }
    }
}

@media (max-width: 480px) {
    .language-toggle {
        width: 36px;
        height: 36px;

        .language-icon {
            font-size: 10px;
        }
    }
}
</style>
