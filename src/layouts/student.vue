/** * Student Layout * Layout for students with read-only access to their
academic records */

<template>
  <v-app>
    <NavigationDrawer
      header-icon="mdi-account-school"
      header-title="Student Portal"
      :items="navigationItems"
      @logout="handleLogout"
    />

    <AppHeader icon="mdi-account-school" title="SmartGrade - Student" />

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
    to: "/student",
    value: "dashboard",
  },
  {
    title: "My Grades",
    icon: "mdi-clipboard-text",
    to: "/student/grades",
    value: "grades",
  },
  {
    title: "Honors & Awards",
    icon: "mdi-trophy",
    to: "/student/honors",
    value: "honors",
  },
  {
    title: "Report Cards",
    icon: "mdi-file-document-outline",
    to: "/student/reports",
    value: "reports",
  },
];

// Placeholder logout handler - will be implemented with Supabase in Phase 2
function handleLogout() {
  console.log("[Student] Logout clicked - will implement with Supabase auth");
  // In Phase 2: await supabase.auth.signOut()
}
</script>
