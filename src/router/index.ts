import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AccountView from '../views/AccountView.vue'
import StorageDemoView from '../views/StorageDemoView.vue'
import Dashboard from '../views/Dashboard.vue'

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
      meta: { requiresAuth: true, requiresAdmin: true }
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
      meta: { requiresAuth: true, requiresUser: true }
    },
    {
      path: '/demo',
      name: 'demo',
      component: StorageDemoView,
      meta: { requiresAuth: true, requiresUser: true }
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  if (authStore.loading) {
    await authStore.initialize()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Redirect authenticated users away from login
    if (authStore.user?.is_admin) {
      next('/dashboard')
    } else {
      next('/account')
    }
  } else if (to.meta.requiresAdmin && !authStore.user?.is_admin) {
    // Admin-only route accessed by non-admin
    next('/account')
  } else if (to.meta.requiresUser && authStore.user?.is_admin) {
    // User-only route accessed by admin
    next('/dashboard')
  } else {
    next()
  }
})

export default router
