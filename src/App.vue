<template>
    <div class="app-container">
        <transition name="fade">
            <div class="splash-screen" v-if="splashScreen">
                <div class="wrap">
                    <img src="./assets/images/logo_ZEP.png" class="logo" alt="logo" />
                    <img src="/Ripple-2s-200px.gif" alt="loading-image" />
                </div>
            </div>
        </transition>

        <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { detect } from "detect-browser"
const browser = detect()
import { useMainStore } from "./stores/main"

export default defineComponent({
    name: "App",
    computed: {
        splashScreen() {
            return useMainStore().splashScreen
        }
    },
    created() {
        if (browser && browser.name) document.getElementsByTagName("html")[0].classList.add(browser.name)
    }
})
</script>


<style lang="scss">
@import "./assets/scss/_variables";

.app-container {
    width: 100%;
    height: 100vh;
    overflow: hidden;
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

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
