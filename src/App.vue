<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();
const drawer = ref(true);

onMounted(() => {
  authStore.initialize();
});

const isAuthPage = computed(() => route.path === "/login");

type NavItem = { title: string; icon: string; to: string };

const adminNav: NavItem[] = [
  { title: "Dashboard", icon: "mdi-view-dashboard", to: "/admin" },
  { title: "Users", icon: "mdi-account-group", to: "/admin/users" },
  { title: "Sections", icon: "mdi-google-classroom", to: "/admin/sections" },
  { title: "Subjects", icon: "mdi-book-open-variant", to: "/admin/subjects" },
  {
    title: "School Years",
    icon: "mdi-calendar-range",
    to: "/admin/school-years",
  },
  { title: "Settings", icon: "mdi-cog", to: "/admin/settings" },
];

const adviserNav: NavItem[] = [
  { title: "Dashboard", icon: "mdi-view-dashboard", to: "/adviser" },
  { title: "Grades", icon: "mdi-clipboard-text", to: "/adviser/grades" },
  { title: "Documents", icon: "mdi-file-document", to: "/adviser/documents" },
  { title: "Students", icon: "mdi-account-school", to: "/adviser/students" },
];

const studentNav: NavItem[] = [
  { title: "Dashboard", icon: "mdi-view-dashboard", to: "/student" },
  { title: "My Grades", icon: "mdi-clipboard-text", to: "/student/grades" },
  { title: "My SF9", icon: "mdi-file-document", to: "/student/sf9" },
];

const navItems = computed<NavItem[]>(() => {
  if (authStore.role === "admin") return adminNav;
  if (authStore.role === "adviser" || authStore.role === "teacher")
    return adviserNav;
  if (authStore.role === "student") return studentNav;
  return [];
});

const showSidebar = computed(
  () => authStore.isAuthenticated && !isAuthPage.value
);
</script>

<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer v-if="showSidebar" v-model="drawer" app width="260">
      <v-list-item class="pa-4">
        <template #prepend>
          <v-avatar color="primary" size="42">
            <v-icon color="white">mdi-school</v-icon>
          </v-avatar>
        </template>
        <v-list-item-title class="text-h6 font-weight-bold"
          >SMARTGRADE</v-list-item-title
        >
        <v-list-item-subtitle class="text-caption">{{
          authStore.role?.toUpperCase()
        }}</v-list-item-subtitle>
      </v-list-item>

      <v-divider />

      <v-list nav density="comfortable">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          color="primary"
          rounded="lg"
          class="mb-1"
        />
      </v-list>

      <template #append>
        <div class="pa-4">
          <v-btn
            block
            variant="tonal"
            color="error"
            prepend-icon="mdi-logout"
            @click="authStore.signOut()"
          >
            Logout
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar v-if="showSidebar" app color="primary" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title class="font-weight-bold">SMARTGRADE</v-app-bar-title>
      <v-spacer />
      <v-chip variant="tonal" color="white" class="mr-2">
        <v-icon start size="18">mdi-account</v-icon>
        {{ authStore.fullName || authStore.profile?.email }}
      </v-chip>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <router-view />
    </v-main>

    <!-- Global Loading -->
    <v-overlay
      :model-value="authStore.loading"
      class="align-center justify-center"
      persistent
    >
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-overlay>
  </v-app>
</template>

<style scoped></style>
