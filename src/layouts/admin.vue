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
      to: '/admin',
      value: 'dashboard',
    },
    {
      title: 'User Management',
      icon: 'mdi-account-group',
      to: '/admin/users',
      value: 'users',
    },
    {
      title: 'School Years',
      icon: 'mdi-calendar-range',
      to: '/admin/school-years',
      value: 'school-years',
    },
    {
      title: 'Sections & Classes',
      icon: 'mdi-google-classroom',
      to: '/admin/sections',
      value: 'sections',
    },
    {
      title: 'Settings',
      icon: 'mdi-cog',
      to: '/admin/settings',
      value: 'settings',
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
