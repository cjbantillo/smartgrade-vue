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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
});

/**
 * PLACEHOLDER ROLE GUARD
 * This is a temporary implementation for Phase 1
 * In future phases, this will be replaced with actual Supabase auth
 *
 * @returns Mock user role based on route path
 */
function getCurrentUserRole(to: RouteLocationNormalized): UserRole | null {
  // TEMPORARY: Infer role from route path for development
  // In production, this will check Supabase session and profiles table
  const path = to.path.toLowerCase();

  if (path.startsWith("/admin")) {
    return "admin";
  }
  if (path.startsWith("/teacher")) {
    return "teacher";
  }
  if (path.startsWith("/student")) {
    return "student";
  }

  return null;
}

/**
 * PLACEHOLDER ROLE-BASED ACCESS GUARD
 * Checks if user has permission to access route
 * This is a placeholder - actual auth will be implemented in Phase 2
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
 * GLOBAL NAVIGATION GUARD (PLACEHOLDER)
 * Phase 1: Only validates route structure
 * Phase 2+: Will add Supabase authentication and real role validation
 */
router.beforeEach((to, from, next) => {
  const requiresRole = to.meta.requiresRole as
    | UserRole
    | UserRole[]
    | undefined;

  // If route requires specific role(s)
  if (requiresRole) {
    const userRole = getCurrentUserRole(to);

    // PLACEHOLDER: In production, redirect to login if no user
    if (!userRole) {
      console.warn(
        `[Router] No user role detected for protected route: ${to.path}`
      );
      // In Phase 2, this will redirect to login
      // For now, allow navigation for development
      next();
      return;
    }

    // Check role access
    if (!hasRoleAccess(requiresRole, userRole)) {
      console.error(
        `[Router] Access denied: ${userRole} cannot access ${to.path}`
      );
      // In Phase 2, redirect to appropriate dashboard or 403 page
      next({ path: "/" });
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
