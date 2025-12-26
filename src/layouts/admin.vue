/** * Admin Layout * Layout for administrative users with full system access */

<template>
  <v-app>
    <NavigationDrawer
      header-icon="mdi-shield-crown"
      header-title="Admin Dashboard"
      :items="navigationItems"
      @logout="handleLogout"
    />

    <AppHeader icon="mdi-shield-crown" title="SmartGrade - Admin" />

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <AppFooter />
  </v-app>
</template>

<script lang="ts" setup>
import type { NavigationItem } from "@/components/layout/NavigationDrawer.vue";
import { useRouter } from "vue-router";
import AppFooter from "@/components/layout/AppFooter.vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import NavigationDrawer from "@/components/layout/NavigationDrawer.vue";
import { useAuth } from "@/composables/useAuth";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const { logout } = useAuth();
const authStore = useAuthStore();

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: "mdi-view-dashboard",
    to: "/admin",
    value: "dashboard",
  },
  {
    title: "Academic Management",
    icon: "mdi-school",
    value: "academic",
    children: [
      {
        title: "School Years",
        icon: "mdi-calendar-range",
        to: "/admin/school-years",
        value: "school-years",
      },
      {
        title: "Classes & Sections",
        icon: "mdi-google-classroom",
        to: "/admin/classes",
        value: "classes",
      },
      {
        title: "Subjects",
        icon: "mdi-book-open-variant",
        to: "/admin/subjects",
        value: "subjects",
      },
    ],
  },
  {
    title: "User Management",
    icon: "mdi-account-group",
    value: "users",
    children: [
      {
        title: "Students",
        icon: "mdi-account-school",
        to: "/admin/students",
        value: "students",
      },
      {
        title: "Teachers",
        icon: "mdi-account-tie",
        to: "/admin/teachers",
        value: "teachers",
      },
    ],
  },
  {
    title: "System",
    icon: "mdi-cog-outline",
    value: "system",
    children: [
      {
        title: "Grade Unlocks",
        icon: "mdi-lock-open-variant",
        to: "/admin/unlock-requests",
        value: "unlock-requests",
      },
      {
        title: "Audit Logs",
        icon: "mdi-text-box-search",
        to: "/admin/audit-logs",
        value: "audit-logs",
      },
      {
        title: "Settings",
        icon: "mdi-cog",
        to: "/admin/settings",
        value: "settings",
      },
    ],
  },
];

// Logout handler with real Supabase auth
async function handleLogout() {
  try {
    const result = await logout();
    if (result.success) {
      authStore.clearUser();
      await router.push("/");
    } else {
      console.error("Logout failed:", result.error);
      alert("Logout failed: " + result.error);
    }
  } catch (err) {
    console.error("Logout exception:", err);
    alert(
      "Logout error: " + (err instanceof Error ? err.message : "Unknown error")
    );
  }
}
</script>
