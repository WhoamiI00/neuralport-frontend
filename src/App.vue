<template>
    <!-- Global Page Loader -->
    <transition name="fade-loader">
        <div v-if="isLoading" class="global-loader-overlay">
            <CustomLoader />
        </div>
    </transition>

    <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
            <component :is="Component" />
        </transition>
    </router-view>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { detect } from "detect-browser"
const browser = detect()
import { useMainStore } from "./stores/main"
import { useRouter } from "vue-router"
import CustomLoader from "./components/zen/CustomLoader.vue"

export default defineComponent({
    name: "App",
    components: {
        CustomLoader
    },
    data() {
        return {
            isLoading: false
        }
    },
    computed: {
        splashScreen() {
            return useMainStore().splashScreen
        }
    },
    created() {
        if (browser && browser.name) {
            const htmlElement = document.getElementsByTagName("html")[0]
            if (htmlElement) htmlElement.classList.add(browser.name)
        }

        // Setup router loading state
        const router = useRouter()
        
        router.beforeEach(() => {
            this.isLoading = true
            return true
        })

        router.afterEach(() => {
            // Small delay to ensure smooth transition
            setTimeout(() => {
                this.isLoading = false
            }, 300)
        })
    }
})
</script>


<style lang="scss">
@import "./assets/scss/_variables";

html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
}

.app-container {
    width: 100%;
    min-height: 100vh;
}

.splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;

    .wrap {
        text-align: center;

        .logo {
            max-width: 200px;
            margin-bottom: 20px;
        }
    }
}

.global-loader-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
    
    &.dark-mode {
        background: rgba(0, 0, 0, 0.7);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
