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
 * Check if input is a valid LRN (Learner Reference Number)
 * LRN format: 12 digits exactly
 */
export function isLRN (input: string): boolean {
  const trimmed = input.trim()
  return /^\d{12}$/.test(trimmed)
}

/**
 * Lookup student email by LRN
 */
export async function getEmailByLRN (lrn: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        user_id,
        profiles:user_id (
          email
        )
      `,
      )
      .eq('lrn', lrn.trim())
      .single()

    if (error || !data || !data.profiles) {
      return null
    }

    return (data.profiles as any).email
  } catch {
    return null
  }
}

/**
 * Email domain validation
 * Admin/Teacher: STRICT @deped.gov.ph requirement
 * Students: Any valid email allowed OR LRN (12 digits)
 */
export function validateDepEdEmail (email: string): EmailValidationResult {
  const trimmedEmail = email.trim().toLowerCase()

  // Check if input is provided
  if (!trimmedEmail) {
    return {
      valid: false,
      error: 'Email or LRN is required',
    }
  }

  // Check if it's an LRN (12 digits) - valid for students
  if (isLRN(trimmedEmail)) {
    return { valid: true }
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Invalid email or LRN format',
    }
  }

  // Students can use any email
  // Admin/Teacher emails are validated after login based on role
  return { valid: true }
}

/**
 * Validate if email is @deped.gov.ph (for admin/teacher roles)
 */
export function isDepEdEmail (email: string): boolean {
  return email.trim().toLowerCase().endsWith('@deped.gov.ph')
}

/**
 * Authentication Composable
 */
export function useAuth () {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Login with email/LRN and password
   * Admin/Teacher: @deped.gov.ph email
   * Students: Email OR LRN (12 digits)
   */
  async function login (credentials: LoginCredentials): Promise<LoginResult> {
    loading.value = true
    error.value = null

    try {
      // Validate input format
      const validation = validateDepEdEmail(credentials.email)
      if (!validation.valid) {
        error.value = validation.error || 'Invalid email or LRN'
        return {
          success: false,
          error: error.value,
        }
      }

      // Determine login email
      let loginEmail = credentials.email.trim().toLowerCase()

      // If input is LRN, look up the student's email
      if (isLRN(credentials.email)) {
        const email = await getEmailByLRN(credentials.email)
        if (!email) {
          error.value = 'Student not found with this LRN'
          return {
            success: false,
            error: error.value,
          }
        }
        loginEmail = email
      }

      // Attempt login with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: loginEmail,
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
        = error_ instanceof Error
          ? error_.message
          : 'An unexpected error occurred'
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
      const message
        = error_ instanceof Error ? error_.message : 'Logout failed'
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
