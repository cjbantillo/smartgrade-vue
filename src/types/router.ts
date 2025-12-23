/**
 * Router type definitions for SmartGrade
 * Defines role-based routing and meta information
 */

export type UserRole = "admin" | "teacher" | "student";

export interface RouteMeta {
  /** Layout to use for this route */
  layout?: "default" | "admin" | "teacher" | "student";

  /** Roles allowed to access this route */
  requiresRole?: UserRole | UserRole[];

  /** Whether authentication is required (placeholder for future implementation) */
  requiresAuth?: boolean;

  /** Page title for navigation */
  title?: string;

  /** Icon for navigation menu */
  icon?: string;

  /** Whether to show in navigation menu */
  showInNav?: boolean;

  /** Order in navigation menu */
  navOrder?: number;
}

declare module "vue-router" {
  interface RouteMeta extends RouteMeta {}
}
