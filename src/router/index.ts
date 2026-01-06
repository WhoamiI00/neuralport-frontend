import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSuperadminStore } from '../stores/superadmin'

// Lazy-loaded routes for better initial load performance
// Each view is loaded only when the user navigates to it
const LoginView = () => import('../views/LoginView.vue')
const AccountView = () => import('../views/AccountView.vue')
const StorageDemoView = () => import('../views/StorageDemoView.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const UserDetailView = () => import('../views/UserDetailView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/:id',
      name: 'user-detail',
      component: UserDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
      meta: { requiresAuth: true }
    },
    {
      path: '/demo',
      name: 'demo',
      component: StorageDemoView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const superadminStore = useSuperadminStore()
  
  // Initialize stores if loading
  if (authStore.loading) {
    await authStore.initialize()
  }
  
  // Initialize superadmin store from localStorage
  if (superadminStore.loading) {
    superadminStore.initialize()
  }
  
  // Check if user is authenticated (either regular user or superadmin)
  const isAuthenticated = authStore.isAuthenticated || superadminStore.isAuthenticated

  // Only validate token if coming from login or on first load
  // Don't validate on every navigation to avoid excessive API calls
  if (to.meta.requiresAuth && authStore.isAuthenticated && !authStore.user) {
    const isValid = await authStore.validateToken()
    if (!isValid) {
      // Token expired, redirect to login
      return next('/login')
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.name === 'login' && isAuthenticated) {
    // Redirect authenticated users away from login
    next('/dashboard')
  } else if (to.meta.requiresAdmin && !authStore.user?.is_admin) {
    // Admin-only route accessed by non-admin
    next('/dashboard')
  } else if (to.meta.requiresUser && authStore.user?.is_admin) {
    // User-only route accessed by admin
    next('/dashboard')
  } else {
    next()
  }
})

export default router
