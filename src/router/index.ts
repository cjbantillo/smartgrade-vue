/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import type { RouteLocationNormalized } from 'vue-router'
import type { UserRole } from '@/types/router'
import { setupLayouts } from 'virtual:generated-layouts'
// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

/**
 * PHASE 3: Real authentication check
 * Checks if user is authenticated with Supabase
 */
function isAuthenticated (): boolean {
  const authStore = useAuthStore()
  return authStore.isAuthenticated
}

/**
 * PLACEHOLDER ROLE GUARD (Phase 3)
 * Role validation will be implemented in Phase 4
 * For now, just infer from route path
 */
function getCurrentUserRole (to: RouteLocationNormalized): UserRole | null {
  // TEMPORARY: Infer role from route path
  // Phase 4 will check profiles table for actual role
  const path = to.path.toLowerCase()

  if (path.startsWith('/admin')) {
    return 'admin'
  }
  if (path.startsWith('/teacher')) {
    return 'teacher'
  }
  if (path.startsWith('/student')) {
    return 'student'
  }
  return null
}

/**
 * Phase 4 will implement real role checking from profiles table
 */
function hasRoleAccess (
  requiredRole: UserRole | UserRole[],
  userRole: UserRole | null,
): boolean {
  if (!userRole) {
    return false
  }

  const requiredRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole]
  return requiredRoles.includes(userRole)
}

/**
 * GLOBAL NAVIGATION GUARD (Phase 3)
 * - Redirects unauthenticated users to login
 * - Public routes (/, /login) are accessible to all
 * - Protected routes require authentication
 * - Role validation is placeholder (Phase 4 will use profiles table)
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth store if not already done
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  // Public routes (no auth required)
  const publicRoutes = ['/', '/login', '/test-supabase']
  const isPublicRoute = publicRoutes.includes(to.path)

  // Allow access to public routes
  if (isPublicRoute) {
    // Redirect to dashboard if already authenticated and trying to access login
    if (to.path === '/login' && isAuthenticated()) {
      next({ path: '/' })
      return
    }
    next()
    return
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    console.warn(`[Router] Unauthenticated access attempt to: ${to.path}`)
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // Check role-based access (placeholder - Phase 4 will use profiles table)
  const requiresRole = to.meta.requiresRole as
    | UserRole
    | UserRole[]
    | undefined
  if (requiresRole) {
    const userRole = getCurrentUserRole(to)

    if (!userRole || !hasRoleAccess(requiresRole, userRole)) {
      console.error(`[Router] Access denied to: ${to.path}`)
      // Redirect to appropriate dashboard or 403 page
      next({ path: '/' })
      return
    }
  }

  next()
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
