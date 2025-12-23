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
import AppFooter from "@/components/layout/AppFooter.vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import NavigationDrawer from "@/components/layout/NavigationDrawer.vue";

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: "mdi-view-dashboard",
    to: "/admin",
    value: "dashboard",
  },
  {
    title: "User Management",
    icon: "mdi-account-group",
    to: "/admin/users",
    value: "users",
  },
  {
    title: "School Years",
    icon: "mdi-calendar-range",
    to: "/admin/school-years",
    value: "school-years",
  },
  {
    title: "Sections & Classes",
    icon: "mdi-google-classroom",
    to: "/admin/sections",
    value: "sections",
  },
  {
    title: "Settings",
    icon: "mdi-cog",
    to: "/admin/settings",
    value: "settings",
  },
];

// Placeholder logout handler - will be implemented with Supabase in Phase 2
function handleLogout() {
  console.log("[Admin] Logout clicked - will implement with Supabase auth");
  // In Phase 2: await supabase.auth.signOut()
}
</script>
