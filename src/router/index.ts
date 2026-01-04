import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

// Lazy-load views
const LoginPage = () => import("@/views/LoginPage.vue");
const NotFound = () => import("@/views/NotFound.vue");

// Admin views
const AdminDashboard = () => import("@/views/AdminDashboard.vue");
const UsersPage = () => import("@/views/admin/UsersPage.vue");
const SectionsPage = () => import("@/views/admin/SectionsPage.vue");
const SubjectsPage = () => import("@/views/admin/SubjectsPage.vue");
const SchoolYearsPage = () => import("@/views/admin/SchoolYearsPage.vue");
const SettingsPage = () => import("@/views/admin/SettingsPage.vue");

// Adviser views
const AdviserDashboard = () => import("@/views/adviser/AdviserDashboard.vue");
const AdviserGradesPage = () => import("@/views/adviser/GradesPage.vue");
const AdviserDocumentsPage = () => import("@/views/adviser/DocumentsPage.vue");
const AdviserStudentsPage = () => import("@/views/adviser/StudentsPage.vue");
const AdviserEnrollPage = () => import("@/views/adviser/EnrollPage.vue");

// Student views
const StudentDashboard = () => import("@/views/student/StudentDashboard.vue");
const StudentGradesPage = () => import("@/views/student/GradesPage.vue");
const StudentSF9Page = () => import("@/views/student/SF9Page.vue");

const routes: RouteRecordRaw[] = [
  // Public routes
  { path: "/", redirect: "/login" },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { guest: true },
  },

  // Admin routes
  {
    path: "/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ["admin"] },
  },
  {
    path: "/admin/users",
    name: "AdminUsers",
    component: UsersPage,
    meta: { requiresAuth: true, roles: ["admin"] },
  },
  {
    path: "/admin/sections",
    name: "AdminSections",
    component: SectionsPage,
    meta: { requiresAuth: true, roles: ["admin"] },
  },
  {
    path: "/admin/subjects",
    name: "AdminSubjects",
    component: SubjectsPage,
    meta: { requiresAuth: true, roles: ["admin"] },
  },
  {
    path: "/admin/school-years",
    name: "AdminSchoolYears",
    component: SchoolYearsPage,
    meta: { requiresAuth: true, roles: ["admin"] },
  },
  {
    path: "/admin/settings",
    name: "AdminSettings",
    component: SettingsPage,
    meta: { requiresAuth: true, roles: ["admin"] },
  },

  // Adviser routes
  {
    path: "/adviser",
    name: "AdviserDashboard",
    component: AdviserDashboard,
    meta: { requiresAuth: true, roles: ["adviser", "teacher"] },
  },
  {
    path: "/adviser/grades",
    name: "AdviserGrades",
    component: AdviserGradesPage,
    meta: { requiresAuth: true, roles: ["adviser", "teacher"] },
  },
  {
    path: "/adviser/documents",
    name: "AdviserDocuments",
    component: AdviserDocumentsPage,
    meta: { requiresAuth: true, roles: ["adviser", "teacher"] },
  },
  {
    path: "/adviser/students",
    name: "AdviserStudents",
    component: AdviserStudentsPage,
    meta: { requiresAuth: true, roles: ["adviser", "teacher"] },
  },
  {
    path: "/adviser/enroll",
    name: "AdviserEnroll",
    component: AdviserEnrollPage,
    meta: { requiresAuth: true, roles: ["adviser", "teacher"] },
  },

  // Student routes
  {
    path: "/student",
    name: "StudentDashboard",
    component: StudentDashboard,
    meta: { requiresAuth: true, roles: ["student"] },
  },
  {
    path: "/student/grades",
    name: "StudentGrades",
    component: StudentGradesPage,
    meta: { requiresAuth: true, roles: ["student"] },
  },
  {
    path: "/student/sf9",
    name: "StudentSF9",
    component: StudentSF9Page,
    meta: { requiresAuth: true, roles: ["student"] },
  },

  // Catch-all
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for auth + role check
router.beforeEach(async (to, _from, next) => {
  const { useAuthStore } = await import("@/stores/auth");
  const authStore = useAuthStore();

  // Wait for auth to initialize
  if (authStore.loading) {
    await authStore.initialize();
  }

  const requiresAuth = to.meta.requiresAuth as boolean;
  const isGuestRoute = to.meta.guest as boolean;
  const allowedRoles = to.meta.roles as string[] | undefined;

  // Redirect logged-in users away from guest routes (like login)
  if (isGuestRoute && authStore.isAuthenticated) {
    const role = authStore.role;
    if (role === "admin") return next("/admin");
    if (role === "adviser" || role === "teacher") return next("/adviser");
    if (role === "student") return next("/student");
    return next("/");
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !authStore.isAuthenticated) {
    return next("/login");
  }

  // Check role permission
  if (requiresAuth && allowedRoles && allowedRoles.length > 0) {
    const userRole = authStore.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard
      if (userRole === "admin") return next("/admin");
      if (userRole === "adviser" || userRole === "teacher")
        return next("/adviser");
      if (userRole === "student") return next("/student");
      return next("/login");
    }
  }

  next();
});

export default router;
