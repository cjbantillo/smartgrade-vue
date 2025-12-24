/**
 * Authentication Store
 * Global state management for authentication
 *
 * PHASE 4: Role-based access
 * - Manages user session
 * - Stores user profile and role
 * - Handles auth state changes
 */

import type { Session, User, UserProfile } from '@/types/auth'

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useProfile } from '@/composables/useProfile'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value && !!session.value)

  const userEmail = computed(() => user.value?.email ?? null)

  const userRole = computed(() => profile.value?.role ?? null)

  const hasRole = computed(() => (role: string | string[]) => {
    if (!profile.value) {
      return false
    }
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(profile.value.role)
  })

  /**
   * Initialize auth state from Supabase
   * Call this on app startup
   */
  async function initialize () {
    if (initialized.value) {
      return
    }

    loading.value = true

    try {
      // Get current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user

        // Fetch user profile with role
        await fetchUserProfile(currentSession.user.id)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null

        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id)
        } else {
          profile.value = null
        }
      })

      initialized.value = true
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch user profile from profiles table
   */
  async function fetchUserProfile (userId: string) {
    const { fetchProfile } = useProfile()
    const result = await fetchProfile(userId)

    if (result.success && result.profile) {
      profile.value = result.profile
    } else {
      console.error('[Auth Store] Failed to fetch profile:', result.error)
      profile.value = null
    }
  }

  /**
   * Set user and profile after successful login
   */
  async function setUser (newUser: User, newSession: Session) {
    user.value = newUser
    session.value = newSession

    // Fetch profile with role
    await fetchUserProfile(newUser.id)
  }

  /**
   * Clear user on logout
   */
  function clearUser () {
    user.value = null
    session.value = null
    profile.value = null
  }

  /**
   * Refresh session
   */
  async function refreshSession () {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Session refresh error:', error)
        return false
      }

      if (data.session) {
        session.value = data.session
        user.value = data.session.user
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to refresh session:', error)
      return false
    }
  }

  return {
    // State
    user,
    session,
    profile,
    loading,
    initialized,

    // Computed
    isAuthenticated,
    userEmail,
    userRole,
    hasRole,

    // Actions
    initialize,
    setUser,
    clearUser,
    refreshSession,
    fetchUserProfile,
  }
})
