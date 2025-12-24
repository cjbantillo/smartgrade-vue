/**
 * Authentication Store
 * Global state management for authentication
 *
 * PHASE 3: Basic auth state only
 * - No role logic yet (Phase 4)
 * - Manages user session
 * - Handles auth state changes
 */

import type { AuthState, Session, User } from '@/types/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value && !!session.value)

  const userEmail = computed(() => user.value?.email ?? null)

  const authState = computed<AuthState>(() => ({
    user: user.value,
    session: session.value,
    loading: loading.value,
    initialized: initialized.value,
  }))

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
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
      })

      initialized.value = true
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Set user after successful login
   */
  function setUser (newUser: User, newSession: Session) {
    user.value = newUser
    session.value = newSession
  }

  /**
   * Clear user on logout
   */
  function clearUser () {
    user.value = null
    session.value = null
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
    loading,
    initialized,

    // Computed
    isAuthenticated,
    userEmail,
    authState,

    // Actions
    initialize,
    setUser,
    clearUser,
    refreshSession,
  }
})
