/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import type { RouteLocationNormalized } from "vue-router";
import type { UserRole } from "@/types/router";
import { setupLayouts } from "virtual:generated-layouts";
// Composables
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
});

/**
 * PHASE 3: Real authentication check
 * Checks if user is authenticated with Supabase
 */
function isAuthenticated(): boolean {
  const authStore = useAuthStore();
  return authStore.isAuthenticated;
}

/**
 * PLACEHOLDER ROLE GUARD (Phase 3)
 * Role validation will be implemented in Phase 4
 * For now, just infer from route path
 */
function getUserRole(): UserRole | null {
  // PHASE 4: Get role from auth store (profiles table)
  const authStore = useAuthStore();
  return authStore.userRole;
}

/**
 * Phase 4 will implement real role checking from profiles table
 */
function hasRoleAccess(
  requiredRole: UserRole | UserRole[],
  userRole: UserRole | null
): boolean {
  if (!userRole) {
    return false;
  }

  const requiredRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];
  return requiredRoles.includes(userRole);
}

/**
 * GLOBAL NAVIGATION GUARD (Phase 4)
 * - Redirects unauthenticated users to login
 * - Public routes (/, /login) are accessible to all
 * - Protected routes require authentication
 * - Role validation uses profiles table
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth store if not already done
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  // Public routes (no auth required)
  const publicRoutes = ["/", "/login", "/test-supabase"];
  const isPublicRoute = publicRoutes.includes(to.path);

  // Allow access to public routes
  if (isPublicRoute) {
    // Redirect to appropriate dashboard if already authenticated and trying to access login
    if (to.path === "/login" && isAuthenticated()) {
      const role = getUserRole();
      if (role === "admin") {
        next({ path: "/admin" });
      } else if (role === "teacher") {
        next({ path: "/teacher" });
      } else if (role === "student") {
        next({ path: "/student" });
      } else {
        next({ path: "/" });
      }
      return;
    }
    next();
    return;
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    console.warn(`[Router] Unauthenticated access attempt to: ${to.path}`);
    next({ path: "/login", query: { redirect: to.fullPath } });
    return;
  }

  // Check role-based access (PHASE 4: Real role checking)
  const requiresRole = to.meta.requiresRole as
    | UserRole
    | UserRole[]
    | undefined;
  if (requiresRole) {
    const userRole = getUserRole();

    if (!userRole || !hasRoleAccess(requiresRole, userRole)) {
      console.error(
        `[Router] Access denied to: ${to.path} (role: ${userRole})`
      );
      // Redirect to appropriate dashboard based on actual role
      if (userRole === "admin") {
        next({ path: "/admin" });
      } else if (userRole === "teacher") {
        next({ path: "/teacher" });
      } else if (userRole === "student") {
        next({ path: "/student" });
      } else {
        next({ path: "/" });
      }
      return;
    }
  }

  next();
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.("Failed to fetch dynamically imported module")) {
    if (localStorage.getItem("vuetify:dynamic-reload")) {
      console.error("Dynamic import error, reloading page did not fix it", err);
    } else {
      console.log("Reloading page to fix dynamic import error");
      localStorage.setItem("vuetify:dynamic-reload", "true");
      location.assign(to.fullPath);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem("vuetify:dynamic-reload");
});

export default router;
