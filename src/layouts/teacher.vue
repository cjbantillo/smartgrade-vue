/** * Teacher Layout * Layout for teachers with class and grade management
access */

<template>
  <v-app>
    <NavigationDrawer
      header-icon="mdi-school"
      header-title="Teacher Dashboard"
      :items="navigationItems"
      @logout="handleLogout"
    />

    <AppHeader icon="mdi-school" title="SmartGrade - Teacher" />

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
      to: '/teacher',
      value: 'dashboard',
    },
    {
      title: 'My Classes',
      icon: 'mdi-google-classroom',
      to: '/teacher/classes',
      value: 'classes',
    },
    {
      title: 'Grades',
      icon: 'mdi-clipboard-text',
      to: '/teacher/grades',
      value: 'grades',
    },
    {
      title: 'Certificates',
      icon: 'mdi-certificate',
      to: '/teacher/certificates',
      value: 'certificates',
    },
    {
      title: 'Documents (SF9/SF10)',
      icon: 'mdi-file-document',
      to: '/teacher/documents',
      value: 'documents',
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
