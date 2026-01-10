<template>
    <div class="login-page" :class="{ 'page-loaded': isPageLoaded, 'dark-mode': isDarkMode }">
        <!-- Dark Mode Toggle -->
        <button 
            class="dark-mode-toggle"
            @click="toggleDarkMode"
            :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
            <Transition name="icon-flip" mode="out-in">
                <svg v-if="isDarkMode" class="toggle-icon sun-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-else class="toggle-icon moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </Transition>
        </button>

        <!-- Language Toggle -->
        <LanguageToggle position="fixed" class="login-language-toggle" />

        <!-- Floating Background Shapes -->
        <ul class="circles">
            <li v-for="n in floatingBlockCount" :key="n"></li>
        </ul>
        
        <!-- Main Content Container -->
        <div class="login-container">
            <!-- Brand Panel -->
            <div class="brand-panel">
                <div class="brand-content">
                    <img 
                        :src="isDarkMode ? '/np.png' : '/np_.png'" 
                        alt="NeuralPort Logo" 
                        class="brand-image"
                    />
                </div>
            </div>

            <!-- Form Panel -->
            <div class="form-panel">
                <div class="form-content">
                    <!-- Login Mode Toggle -->
                    <div class="login-mode-toggle">
                        <button 
                            type="button"
                            class="mode-btn"
                            :class="{ active: loginMode === 'user' }"
                            @click="loginMode = 'user'"
                        >
                            <i class="mdi mdi-account"></i>
                            Personal Login
                        </button>
                        <button 
                            type="button"
                            class="mode-btn"
                            :class="{ active: loginMode === 'admin' }"
                            @click="loginMode = 'admin'"
                        >
                            <i class="mdi mdi-shield-account"></i>
                            Admin Login
                        </button>
                    </div>

                    <Transition name="form-slide" mode="out-in">
                        <!-- VR User Login Form (Name + PIN) -->
                        <form v-if="loginMode === 'user'" key="user-form" class="auth-form" @submit.prevent="handleLogin">
                            <h1 class="form-title">{{ t('auth.title') }}</h1>
                            <p class="form-subtitle">{{ t('auth.subtitle') }}</p>

                            <div class="input-group">
                                <input 
                                    type="text" 
                                    v-model="loginForm.name"
                                    placeholder=" "
                                    required
                                    autocomplete="name"
                                />
                                <label>{{ t('auth.name') }}</label>
                                <span class="input-highlight"></span>
                            </div>

                            <div class="input-group">
                                <input 
                                    :type="showPin ? 'text' : 'password'"
                                    v-model="loginForm.pin"
                                    placeholder=" "
                                    required
                                    autocomplete="off"
                                />
                                <label>{{ t('auth.pin') }}</label>
                                <span class="input-highlight"></span>
                                <button 
                                    type="button"
                                    class="toggle-password-btn"
                                    @click="showPin = !showPin"
                                    tabindex="-1"
                                >
                                    <i class="mdi" :class="showPin ? 'mdi-eye-off' : 'mdi-eye'"></i>
                                </button>
                            </div>


                            <button 
                                type="submit" 
                                class="submit-btn" 
                                :class="{ 'is-loading': loading }"
                                :disabled="loading"
                            >
                                <span class="btn-text">{{ loading ? '' : t('auth.signIn') }}</span>
                                <span v-if="loading" class="btn-loader"></span>
                            </button>

                            <Transition name="error-slide">
                                <div v-if="error" class="error-message">
                                    {{ error }}
                                </div>
                            </Transition>
                        </form>

                        <!-- Unified Admin Login Form (Superadmin + Team Admin + VR Admin) -->
                        <form v-else key="admin-form" class="auth-form" @submit.prevent="handleAdminLogin">
                            <h1 class="form-title">Admin Portal</h1>
                            <p class="form-subtitle">Manage your team and devices</p>

                            <div class="input-group">
                                <input 
                                    type="text" 
                                    v-model="adminForm.identifier"
                                    placeholder=" "
                                    required
                                    autocomplete="username"
                                />
                                <label>Email or Device ID</label>
                                <span class="input-highlight"></span>
                            </div>

                            <div class="input-group">
                                <input 
                                    :type="showAdminLoginPassword ? 'text' : 'password'"
                                    v-model="adminForm.password"
                                    placeholder=" "
                                    required
                                    autocomplete="current-password"
                                />
                                <label>Password</label>
                                <span class="input-highlight"></span>
                                <button 
                                    type="button"
                                    class="toggle-password-btn"
                                    @click="showAdminLoginPassword = !showAdminLoginPassword"
                                    tabindex="-1"
                                >
                                    <i class="mdi" :class="showAdminLoginPassword ? 'mdi-eye-off' : 'mdi-eye'"></i>
                                </button>
                            </div>

                            <!-- Registration fields - commented out
                            <div v-if="showRegister" class="input-group">
                                <input 
                                    type="text"
                                    v-model="adminForm.name"
                                    placeholder=" "
                                    autocomplete="name"
                                />
                                <label>Display Name (optional)</label>
                                <span class="input-highlight"></span>
                            </div>
                            -->

                            <button 
                                type="submit" 
                                class="submit-btn" 
                                :class="{ 'is-loading': loading }"
                                :disabled="loading"
                            >
                                <span class="btn-text">{{ loading ? '' : 'Sign In' }}</span>
                                <span v-if="loading" class="btn-loader"></span>
                            </button>

                            <!-- Registration toggle - commented out
                            <div class="toggle-register">
                                <span>{{ showRegister ? 'Already have an account?' : 'New admin?' }}</span>
                                <button type="button" class="link-btn" @click="showRegister = !showRegister">
                                    {{ showRegister ? 'Sign In' : 'Register' }}
                                </button>
                            </div>
                            -->

                            <Transition name="error-slide">
                                <div v-if="error" class="error-message">
                                    {{ error }}
                                </div>
                            </Transition>
                        </form>
                    </Transition>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSuperadminStore } from '../stores/superadmin'
import { usePoolAdminStore } from '../stores/poolAdmin'
import { useTheme } from '../composables/useTheme'
import { useLanguage } from '../composables/useLanguage'
import LanguageToggle from '../components/zen/LanguageToggle.vue'

const authStore = useAuthStore()
const superadminStore = useSuperadminStore()
const poolAdminStore = usePoolAdminStore()
const router = useRouter()
const route = useRoute()

// View state
const isPageLoaded = ref(false)
const loading = ref(false)
const error = ref('')

// Login mode: 'user' or 'admin' (merged superadmin + team admin)
const loginMode = ref<'user' | 'admin'>('user')
// const showRegister = ref(false) // Registration disabled
const showAdminLoginPassword = ref(false)

// Theme management
const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme()

// Language management
const { t } = useLanguage()

// Login form data (Personal Login: Name + PIN)
const loginForm = reactive({
    name: '',
    pin: ''
})

// Unified Admin form data (for superadmin, team admin, and VR admin)
const adminForm = reactive({
    identifier: '', // Can be email (for superadmin/pool admin) or device_id (for VR admin)
    password: '',
    name: '' // kept for potential future use
})

// Admin setup - commented out (no longer used in name-based login)
// const showAdminSetup = ref(false)
// const adminPassword = ref('')

// Password visibility toggles
const showPin = ref(false)
// const showAdminPassword = ref(false) // No longer used

// Handle VR user login (Personal Login: Name + PIN)
async function handleLogin() {
    error.value = ''
    loading.value = true
    try {
        await authStore.signInByName(loginForm.name, loginForm.pin)
        
        // Redirect to dashboard
        router.push((route.query.redirect as string) || '/dashboard')
    } catch (e: any) {
        error.value = e?.message ?? 'Login failed'
    } finally {
        loading.value = false
    }
}

// Handle unified admin login
// - If identifier contains '@' -> email-based login (superadmin first, then pool admin)
// - If identifier has no '@' -> VR admin login (device_id + admin password)
async function handleAdminLogin() {
    error.value = ''
    loading.value = true
    
    const identifier = adminForm.identifier.trim()
    const isEmailLogin = identifier.includes('@')
    
    try {
        if (isEmailLogin) {
            // Email-based login: try superadmin first, then pool admin
            try {
                await superadminStore.login(identifier, adminForm.password)
                // Superadmin login succeeded
                router.push('/dashboard')
                return
            } catch (superadminError: any) {
                console.log('Superadmin login failed, trying team admin...', superadminError?.message)
            }
            
            // If superadmin fails, try team admin (pool admin) login
            const result = await poolAdminStore.login(identifier, adminForm.password)
            
            if (!result.success) {
                // Both logins failed
                error.value = 'Invalid credentials. Please check your email and password.'
                return
            }
            
            // Team admin login succeeded
            router.push('/dashboard')
        } else {
            // VR Admin login: device_id + admin password
            // Use the auth store's signIn with device_id and admin password as PIN
            const result = await authStore.signIn(identifier, adminForm.password)
            
            if (result.needsAdminSetup) {
                error.value = 'This device needs initial admin setup. Please use Personal Login.'
                return
            }
            
            // Check if this was actually an admin login
            if (!authStore.user?.is_admin) {
                // Logged in as regular user, not admin - sign out and show error
                await authStore.signOut()
                error.value = 'Invalid admin credentials. Please check your device ID and admin password.'
                return
            }
            
            // VR Admin login succeeded
            router.push('/dashboard')
        }
    } catch (e: any) {
        error.value = e?.message ?? 'Login failed'
    } finally {
        loading.value = false
    }
}

/* Registration handlers - commented out
async function handleSuperadminRegister() {
    error.value = ''
    loading.value = true
    try {
        await superadminStore.register(
            adminForm.email, 
            adminForm.password, 
            adminForm.name || undefined
        )
        router.push('/dashboard')
    } catch (e: any) {
        error.value = e?.message ?? 'Registration failed'
    } finally {
        loading.value = false
    }
}
*/

// Page entry animation
onMounted(() => {
    // Check if redirected due to token expiration
    if (route.query.expired === 'true') {
        error.value = t('auth.sessionExpired')
    }
    
    setTimeout(() => {
        isPageLoaded.value = true
    }, 100)
})

// Responsive floating block count
const windowWidth = ref(window.innerWidth)
const floatingBlockCount = computed(() => (windowWidth.value < 768 ? 2 : 5))

function handleResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
// Variables - Light Mode
$teal: #a8edea;
$peach: #fed6e3;
$cream: #f5e6ca;
$dark: #2d3748;
$gray: #718096;
$transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
$transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

// Dark Mode Variables
$dark-bg-1: #0f172a;
$dark-bg-2: #1e293b;
$dark-bg-3: #334155;
$dark-surface: #1e293b;
$dark-input: #0f172a;
$dark-border: #374151;
$dark-text-heading: #f1f5f9;
$dark-text-body: #cbd5e1;
$dark-text-muted: #64748b;
$dark-accent: #22d3ee;
$dark-teal: #2dd4bf;
$dark-peach: #fb7185;

// Dark Mode Toggle Button
.dark-mode-toggle {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 1000;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s $transition-smooth;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    outline: none;

    &:hover {
        transform: scale(1.1) rotate(15deg);
        background: rgba(255, 255, 255, 0.35);
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

      &:active {
          transform: scale(1.05) rotate(15deg);
      }

    .toggle-icon {
        width: 50px;
        height: 50px;
        color: $dark;
        transition: color 0.3s ease;
    }

    .sun-icon {
        color: #fbbf24;
        scale:150%;
    }

    .moon-icon {
        color: $dark;
        scale:150%;
    }
}

// Language Toggle Button (positioned below dark mode toggle)
.login-language-toggle {
    top: 94px !important;
    right: 24px !important;
}

// Icon Flip Transition
.icon-flip-enter-active,
.icon-flip-leave-active {
    transition: all 0.3s $transition-smooth;
}

.icon-flip-enter-from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.5);
}

.icon-flip-leave-to {
    opacity: 0;
    transform: rotate(90deg) scale(0.5);
}

.login-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, $teal 0%, $peach 50%, $cream 100%);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s $transition-smooth, background 0.5s ease;

    &.page-loaded {
        opacity: 1;
        transform: translateY(0);
    }

    // DARK MODE STYLES
    &.dark-mode {
        background: linear-gradient(135deg, $dark-bg-1 0%, $dark-bg-2 50%, $dark-bg-3 100%);

        .dark-mode-toggle {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);

            &:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
        }

        .circles li {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);

            &:nth-child(1) {
                background: linear-gradient(135deg, rgba($dark-teal, 0.3), rgba($dark-peach, 0.2));
                border-color: rgba($dark-teal, 0.3);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba($dark-teal, 0.2);
            }

            &:nth-child(2) {
                background: rgba($dark-peach, 0.4);
                border-color: rgba($dark-peach, 0.5);
                box-shadow: 0 0 25px rgba($dark-peach, 0.3);
            }

            &:nth-child(3) {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.3);
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
            }

            &:nth-child(4) {
                background: linear-gradient(45deg, rgba($dark-teal, 0.3), rgba(255, 255, 255, 0.1));
                border-color: rgba($dark-teal, 0.3);
                box-shadow: 0 0 40px rgba($dark-teal, 0.3);
            }

            &:nth-child(5) {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.3);
            }
        }

        .login-container {
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .brand-panel {
            background: linear-gradient(135deg, rgba($dark-teal, 0.1) 0%, rgba($dark-peach, 0.1) 100%);
        }

        .form-panel {
            background: rgba($dark-surface, 0.6);
            border-left-color: rgba(255, 255, 255, 0.1);
        }

        .form-title {
            color: $dark-text-heading;
        }

        .form-subtitle {
            color: $dark-text-muted;
        }

        .input-group {
            input {
                color: $dark-text-body;
                border-bottom-color: rgba($dark-teal, 0.3);

                &::placeholder {
                    color: $dark-text-muted;
                }

                &:focus {
                    border-bottom-color: $dark-teal;
                }
            }

            label {
                color: $dark-text-muted;
            }

            .input-highlight {
                background: linear-gradient(90deg, $dark-teal, $dark-peach);
            }

            .toggle-password-btn {
                color: $dark-text-muted;

                &:hover {
                    color: $dark-teal;
                }
            }
        }

        .checkbox-wrapper {
            .checkmark {
                border-color: rgba($dark-text-muted, 0.4);

                &::after {
                    border-color: $dark-teal;
                }
            }

            .checkbox-label {
                color: $dark-text-body;
            }

            input[type="checkbox"]:checked + .checkmark {
                background: rgba($dark-teal, 0.2);
                border-color: $dark-teal;
            }
        }

        .forgot-link {
            color: $dark-accent;

            &:hover {
                color: lighten($dark-accent, 10%);
            }
        }

        .submit-btn {
            background: rgba($dark-surface, 0.8);
            color: $dark-text-heading;
            border-color: rgba($dark-teal, 0.3);
            box-shadow: 0 4px 15px rgba($dark-teal, 0.15);

            &:hover:not(:disabled) {
                background: rgba($dark-teal, 0.2);
                border-color: $dark-teal;
                box-shadow: 0 8px 25px rgba($dark-teal, 0.25);
            }

            .btn-loader {
                border-color: rgba($dark-teal, 0.3);
                border-top-color: $dark-teal;
            }
        }

        .error-message {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.4);
            color: #fca5a5;
        }
    }
}

// Global transition for dark mode
.login-page,
.login-page *,
.login-page *::before,
.login-page *::after {
    transition-property: background-color, border-color, color, fill, stroke, box-shadow, filter;
    transition-duration: 0.3s;
    transition-timing-function: ease;
}

.circles li,
.btn-loader,
.submit-btn,
.dark-mode-toggle {
    transition-property: background-color, border-color, color, fill, stroke, box-shadow, filter, transform, opacity;
}

// Floating Circles
.circles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
        position: absolute;
        display: block;
        width: 30px;
        height: 30px;
        background: rgba(255, 255, 255, 0.7);
        animation: animate 25s linear infinite;
        bottom: -150px;
        border-radius: 0;
        border: 2px solid rgba(255, 255, 255, 0.5);
    }

    li:nth-child(1) {
        left: 25%;
        width: 120px;
        height: 120px;
        animation-delay: 0s;
        background: linear-gradient(135deg, rgba(168, 237, 234, 0.7), rgba(254, 214, 227, 0.6));
        backdrop-filter: blur(8px);
        border: 2px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 0 20px rgba(168, 237, 234, 0.4);
    }

    li:nth-child(2) {
        left: 10%;
        width: 35px;
        height: 35px;
        animation-delay: 2s;
        animation-duration: 12s;
        background: rgba(254, 214, 227, 0.85);
        border: 2px solid rgba(254, 214, 227, 0.9);
        box-shadow: 0 0 25px rgba(254, 214, 227, 0.7);
    }

    li:nth-child(3) {
        left: 70%;
        width: 40px;
        height: 40px;
        animation-delay: 4s;
        background: rgba(255, 255, 255, 0.2);
        border: 3px solid rgba(255, 255, 255, 0.85);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
    }

    li:nth-child(4) {
        left: 40%;
        width: 90px;
        height: 90px;
        animation-delay: 0s;
        animation-duration: 18s;
        background: linear-gradient(45deg, rgba(168, 237, 234, 0.75), rgba(245, 230, 202, 0.65));
        border: 2px solid rgba(168, 237, 234, 0.7);
        box-shadow: 0 0 40px rgba(168, 237, 234, 0.6);
    }

    li:nth-child(5) {
        left: 65%;
        width: 35px;
        height: 35px;
        animation-delay: 0s;
        background: rgba(255, 255, 255, 0.5);
        border: 3px dashed rgba(255, 255, 255, 0.9);
    }
}

@keyframes animate {
    0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
        border-radius: 0;
    }
    100% {
        transform: translateY(-1200px) rotate(720deg);
        opacity: 0;
        border-radius: 50%;
    }
}

// Main Container
.login-container {
    position: relative;
    z-index: 1;
    display: flex;
    width: 95%;
    max-width: 900px;
    height: 520px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3);
    animation: container-entry 0.8s $transition-smooth 0.2s both;
}

@keyframes container-entry {
    from {
        opacity: 0;
        transform: translateY(30px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

// Brand Panel
.brand-panel {
    position: absolute;
    left: 0;
    top: 0;
    width: 50%;
    height: 100%;
    z-index: 2;
    transition: transform 0.7s $transition-smooth;
    overflow: hidden;

    .brand-content {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.4s $transition-smooth;
    }

    .brand-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        animation: pulse-subtle 4s ease-in-out infinite;
        transition: width 0.4s $transition-smooth, height 0.4s $transition-smooth;
    }
}

@keyframes pulse-subtle {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

// Form Panel
.form-panel {
    position: absolute;
    right: 0;
    top: 0;
    width: 50%;
    height: 100%;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.4);
    transition: transform 0.7s $transition-smooth;
    display: flex;
    align-items: center;
    justify-content: center;
}

.form-content {
    width: 100%;
    height: 100%;
    padding: 40px 35px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

// Login Mode Toggle
.login-mode-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    padding: 4px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;

    .mode-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        font-size: 0.85rem;
        font-weight: 600;
        color: $gray;
        background: transparent;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s $transition-smooth;

        i {
            font-size: 1.1rem;
        }

        &:hover:not(.active) {
            background: rgba(0, 0, 0, 0.05);
            color: $dark;
        }

        &.active {
            background: white;
            color: $dark;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
    }
}

// Toggle Register Link
.toggle-register {
    margin-top: 16px;
    text-align: center;
    font-size: 0.9rem;
    color: $gray;

    .link-btn {
        background: none;
        border: none;
        color: $teal;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 8px;
        margin-left: 4px;
        transition: color 0.3s ease;

        &:hover {
            color: darken($teal, 15%);
            text-decoration: underline;
        }
    }
}

// Dark mode styles for login toggle
:global(.dark) {
    .login-mode-toggle {
        background: rgba(255, 255, 255, 0.05);

        .mode-btn {
            color: $dark-text-muted;

            &:hover:not(.active) {
                background: rgba(255, 255, 255, 0.05);
                color: $dark-text-body;
            }

            &.active {
                background: rgba($dark-teal, 0.2);
                color: $dark-text-heading;
                box-shadow: 0 2px 8px rgba($dark-teal, 0.2);
            }
        }
    }

    .toggle-register {
        color: $dark-text-muted;

        .link-btn {
            color: $dark-teal;

            &:hover {
                color: lighten($dark-teal, 10%);
            }
        }
    }
}

.auth-form {
    width: 100%;
}

.form-title {
    margin: 0 0 6px 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: $dark;
    letter-spacing: -0.5px;
}

.form-subtitle {
    margin: 0 0 28px 0;
    font-size: 0.95rem;
    color: $gray;
}

// Input Groups with Floating Labels
.input-group {
    position: relative;
    margin-bottom: 22px;

    input {
        width: 100%;
        padding: 14px 40px 10px 0;
        font-size: 1rem;
        color: $dark;
        background: transparent;
        border: none;
        border-bottom: 2px solid rgba($teal, 0.4);
        outline: none;
        transition: all 0.3s $transition-smooth;
        box-sizing: border-box;

        &:focus {
            border-bottom-color: transparent;
        }

        &:focus ~ label,
        &:not(:placeholder-shown) ~ label {
            top: -8px;
            font-size: 0.75rem;
            color: $teal;
        }

        &:focus ~ .input-highlight {
            width: 100%;
        }

        &:focus {
            outline: none;
        }
    }

    label {
        position: absolute;
        top: 14px;
        left: 0;
        font-size: 0.95rem;
        color: $gray;
        pointer-events: none;
        transition: all 0.3s $transition-smooth;
    }

    .input-highlight {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, $teal, $peach);
        transition: width 0.4s $transition-smooth;
    }

    .toggle-password-btn {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: $gray;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s ease;
        outline: none;

        i {
            font-size: 1.2rem;
        }

        &:hover {
            color: $teal;
        }

        &:active {
            transform: translateY(-50%) scale(0.95);
        }
    }
}

// Form Options
.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.checkbox-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
        display: none;

        &:checked + .checkmark {
            background: rgba($teal, 0.2);
            border-color: $teal;

            &::after {
                content: '';
                display: block;
            }
        }
    }

    .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid rgba($gray, 0.4);
        border-radius: 4px;
        margin-right: 8px;
        position: relative;
        transition: all 0.3s $transition-smooth;

        &::after {
            content: '';
            position: absolute;
            display: none;
            left: 4px;
            top: 1px;
            width: 4px;
            height: 8px;
            border: solid $teal;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
    }

    .checkbox-label {
        font-size: 0.85rem;
        color: $gray;
    }
}

.forgot-link {
    font-size: 0.85rem;
    color: $gray;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
        color: darken($teal, 15%);
    }
}

// Submit Button
.submit-btn {
    width: 100%;
    padding: 14px 24px;
    font-size: 1rem;
    font-weight: 600;
    color: $dark;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s $transition-smooth;
    box-shadow: 0 4px 15px rgba($teal, 0.25);

    &:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.02);
        background: rgba($teal, 0.2);
        border-color: rgba($teal, 0.5);
        box-shadow: 0 8px 25px rgba($teal, 0.35);
    }

    &:active:not(:disabled) {
        transform: translateY(-1px) scale(1.01);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.8;
    }

    &.is-loading {
        .btn-text {
            opacity: 0;
        }
    }

    .btn-loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 22px;
        height: 22px;
        border: 3px solid rgba($teal, 0.3);
        border-top-color: $teal;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
}

@keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
}

// Error Message
.error-message {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.875rem;
    text-align: center;
}

// Form Slide Transition
.form-slide-enter-active,
.form-slide-leave-active {
    transition: all 0.4s $transition-smooth;
}

.form-slide-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.form-slide-leave-to {
    opacity: 0;
    transform: translateX(-30px);
}

// Error Slide Transition
.error-slide-enter-active,
.error-slide-leave-active {
    transition: all 0.3s $transition-smooth;
}

.error-slide-enter-from,
.error-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

// RESPONSIVE DESIGN
@media (max-width: 639px) {
    .dark-mode-toggle {
        top: 16px;
        right: 16px;
        width: 52px;
        height: 52px;

        .toggle-icon {
            width: 44px;
            height: 44px;
        }
    }

    .login-page {
        padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }

    .circles {
        li:nth-child(2),
        li:nth-child(3),
        li:nth-child(5) {
            display: none;
        }
    }

    .login-container {
        flex-direction: column;
        width: 92%;
        max-width: 400px;
        height: auto;
        max-height: 90vh;
        border-radius: 16px;
        overflow-y: auto;
    }

    .brand-panel {
        position: relative;
        width: 100%;
        height: 140px;
        min-height: 140px;
        transition: transform 0.4s $transition-smooth, opacity 0.4s $transition-smooth;
        overflow: hidden;

        .brand-content {
            padding: 0;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
        }

        .brand-image {
            width: 100%;
            height: 100%;
            max-width: none;
            object-fit: cover;
            object-position: center 45%;
            transform: scale(1.5);
        }
    }

    .form-panel {
        position: relative;
        width: 100%;
        height: auto;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.4);
        transition: transform 0.4s $transition-smooth;
    }

    .form-content {
        padding: 20px 20px 24px;
    }

    .form-title {
        font-size: 1.4rem;
        margin-bottom: 4px;
    }

    .form-subtitle {
        font-size: 0.875rem;
        margin-bottom: 20px;
    }

    .input-group {
        margin-bottom: 18px;

        input {
            padding: 12px 0 8px;
            font-size: 0.95rem;
        }

        label {
            font-size: 0.9rem;
        }
    }

    .form-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 20px;
    }

    .checkbox-wrapper {
        .checkmark {
            width: 16px;
            height: 16px;
        }

        .checkbox-label {
            font-size: 0.8rem;
        }
    }

    .forgot-link {
        font-size: 0.9rem;
    }

    .submit-btn {
        min-height: 48px;
        padding: 14px 20px;
        font-size: 1rem;
        border-radius: 10px;
    }

    .error-message {
        margin-top: 14px;
        padding: 10px 14px;
        font-size: 0.8rem;
    }

    .form-slide-enter-active,
    .form-slide-leave-active {
        transition: all 0.3s $transition-smooth;
    }

    .form-slide-enter-from {
        opacity: 0;
        transform: translateY(20px);
    }

    .form-slide-leave-to {
        opacity: 0;
        transform: translateY(-20px);
    }
}

@media (min-width: 640px) and (max-width: 767px) {
    .dark-mode-toggle {
        top: 16px;
        right: 16px;
        width: 56px;
        height: 56px;

        .toggle-icon {
            width: 48px;
            height: 48px;
        }
    }

    .circles {
        li:nth-child(3),
        li:nth-child(5) {
            display: none;
        }
    }

    .login-container {
        flex-direction: column;
        width: 90%;
        max-width: 500px;
        height: auto;
        max-height: 95vh;
        border-radius: 18px;
    }

    .brand-panel {
        position: relative;
        width: 100%;
        height: 160px;
        min-height: 160px;
        transition: transform 0.4s $transition-smooth, opacity 0.4s $transition-smooth;
        overflow: hidden;

        .brand-content {
            padding: 0;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
        }

        .brand-image {
            width: 100%;
            height: 100%;
            max-width: none;
            object-fit: cover;
            object-position: center;
            transform: scale(1.5);
        }
    }

    .form-panel {
        position: relative;
        width: 100%;
        height: auto;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.4);
    }

    .form-content {
        padding: 24px 28px;
    }

    .form-title {
        font-size: 1.5rem;
    }

    .form-subtitle {
        font-size: 0.9rem;
        margin-bottom: 22px;
    }

    .input-group {
        margin-bottom: 20px;

        input {
            font-size: 0.98rem;
        }
    }
}

@media (min-width: 768px) and (max-width: 1023px) {
    .login-container {
        width: 90%;
        max-width: 800px;
        height: 480px;
    }

    .form-content {
        padding: 35px 30px;
    }

    .form-title {
        font-size: 1.6rem;
    }

    .form-subtitle {
        font-size: 0.92rem;
        margin-bottom: 24px;
    }

    .input-group {
        margin-bottom: 20px;

        input {
            font-size: 0.98rem;
        }
    }
}

@media (min-width: 1024px) {
    .login-container {
        width: 95%;
        max-width: 900px;
        height: 520px;
    }

    .form-content {
        padding: 40px 35px;
    }

    .form-title {
        font-size: 1.8rem;
    }

    .form-subtitle {
        font-size: 0.95rem;
        margin-bottom: 28px;
    }

    .input-group {
        margin-bottom: 22px;

        input {
            font-size: 1rem;
        }
    }
}

@media (min-width: 1440px) {
    .login-container {
        max-width: 950px;
    }

    .form-content {
        padding: 45px 40px;
    }

    .form-title {
        font-size: 2rem;
    }

    .form-subtitle {
        font-size: 1rem;
    }

    .input-group {
        margin-bottom: 24px;

        input {
            font-size: 1.05rem;
        }
    }

    .submit-btn {
        padding: 16px 28px;
        font-size: 1.05rem;
    }
}

@media (max-height: 500px) and (orientation: landscape) {
    .dark-mode-toggle {
        top: 12px;
        right: 12px;
        width: 50px;
        height: 50px;

        .toggle-icon {
            width: 42px;
            height: 42px;
        }
    }

    .login-container {
        max-height: 95vh;
        height: auto;
    }

    .brand-panel {
        position: relative;
        width: 100%;
        height: 100px;
        min-height: 100px;
        overflow: hidden;

        .brand-content {
            padding: 0;
            width: 100%;
            height: 100%;
        }

        .brand-image {
            width: 100%;
            height: 100%;
            max-width: none;
            object-fit: cover;
            object-position: center;
            transform: scale(1.8);
        }
    }

    .form-panel {
        position: relative;
        width: 100%;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.4);
    }

    .form-content {
        padding: 16px 24px;
    }

    .form-title {
        font-size: 1.3rem;
        margin-bottom: 2px;
    }

    .form-subtitle {
        font-size: 0.8rem;
        margin-bottom: 14px;
    }

    .input-group {
        margin-bottom: 14px;
    }

    .form-options {
        margin-bottom: 14px;
    }

    .error-message {
        margin-top: 12px;
        padding: 8px 12px;
    }

    .circles {
        li:nth-child(2),
        li:nth-child(3),
        li:nth-child(4),
        li:nth-child(5) {
            display: none;
        }
    }
}
</style>
