/**
 * Authentication Composable
 * Handles Supabase authentication logic
 *
 * PHASE 3: Login/Logout only
 * - STRICT @deped.gov.ph email validation
 * - No signup UI
 * - No role logic (comes in Phase 4)
 */

import type {
  EmailValidationResult,
  LoginCredentials,
  LoginResult,
  LogoutResult,
} from '@/types/auth'

import { ref } from 'vue' // or other external imports

import { supabase } from '@/services/supabase'

/**
 * Email domain validation
 * STRICT RULE: Only @deped.gov.ph emails allowed
 */
export function validateDepEdEmail (email: string): EmailValidationResult {
  const trimmedEmail = email.trim().toLowerCase()

  // Check if email is provided
  if (!trimmedEmail) {
    return {
      valid: false,
      error: 'Email is required',
    }
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Invalid email format',
    }
  }

  // STRICT: Must be @deped.gov.ph
  if (!trimmedEmail.endsWith('@deped.gov.ph')) {
    return {
      valid: false,
      error: 'Only @deped.gov.ph email addresses are allowed',
    }
  }

  return { valid: true }
}

/**
 * Authentication Composable
 */
export function useAuth () {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Login with email and password
   * STRICT: Only @deped.gov.ph emails allowed
   */
  async function login (credentials: LoginCredentials): Promise<LoginResult> {
    loading.value = true
    error.value = null

    try {
      // Validate DepEd email domain
      const validation = validateDepEdEmail(credentials.email)
      if (!validation.valid) {
        error.value = validation.error || 'Invalid email'
        return {
          success: false,
          error: error.value,
        }
      }

      // Attempt login with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        },
      )

      if (authError) {
        // User-friendly error messages
        if (authError.message.includes('Invalid login credentials')) {
          error.value = 'Invalid email or password'
        } else if (authError.message.includes('Email not confirmed')) {
          error.value = 'Please confirm your email address'
        } else {
          error.value = authError.message
        }

        return {
          success: false,
          error: error.value,
        }
      }

      if (!data.user) {
        error.value = 'Login failed - no user data received'
        return {
          success: false,
          error: error.value,
        }
      }

      return {
        success: true,
        user: data.user,
      }
    } catch (error_) {
      const message
        = error_ instanceof Error ? error_.message : 'An unexpected error occurred'
      error.value = message
      return {
        success: false,
        error: message,
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout current user
   */
  async function logout (): Promise<LogoutResult> {
    loading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signOut()

      if (authError) {
        error.value = authError.message
        return {
          success: false,
          error: error.value,
        }
      }

      return { success: true }
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Logout failed'
      error.value = message
      return {
        success: false,
        error: message,
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get current session
   */
  async function getSession () {
    try {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        return null
      }

      return data.session
    } catch (error_) {
      console.error('Failed to get session:', error_)
      return null
    }
  }

  /**
   * Get current user
   */
  async function getUser () {
    try {
      const { data, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('User error:', userError)
        return null
      }

      return data.user
    } catch (error_) {
      console.error('Failed to get user:', error_)
      return null
    }
  }

  return {
    // State
    loading,
    error,

    // Methods
    login,
    logout,
    getSession,
    getUser,
    validateDepEdEmail,
  }
}
