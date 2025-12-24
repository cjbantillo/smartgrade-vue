<!--
  Student Layout
  Layout for students with read-only access to their academic records
-->

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
  import type { NavigationItem } from '@/components/layout/NavigationDrawer.vue'
  import { useRouter } from 'vue-router'
  import AppFooter from '@/components/layout/AppFooter.vue'
  import AppHeader from '@/components/layout/AppHeader.vue'
  import NavigationDrawer from '@/components/layout/NavigationDrawer.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const { logout } = useAuth()
  const authStore = useAuthStore()

  const navigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      icon: 'mdi-view-dashboard',
      to: '/student',
      value: 'dashboard',
    },
    {
      title: 'My Grades',
      icon: 'mdi-clipboard-text',
      to: '/student/grades',
      value: 'grades',
    },
    {
      title: 'Honors & Awards',
      icon: 'mdi-trophy',
      to: '/student/honors',
      value: 'honors',
    },
    {
      title: 'Report Cards',
      icon: 'mdi-file-document-outline',
      to: '/student/reports',
      value: 'reports',
    },
  ]

  // Logout handler with real Supabase auth
  async function handleLogout () {
    const result = await logout()
    if (result.success) {
      authStore.clearUser()
      router.push('/login')
    } else {
      console.error('Logout failed:', result.error)
    }
  }
</script>
