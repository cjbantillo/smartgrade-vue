/**
 * Authentication Type Definitions
 * Types for Supabase Auth integration
 */

import type { Session, User } from '@supabase/supabase-js'

/**
 * Re-export Supabase types for convenience
 */

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Current authenticated user */
  user: User | null
  /** Current session */
  session: Session | null
  /** Loading state for auth operations */
  loading: boolean
  /** Whether auth state has been initialized */
  initialized: boolean
}

/**
 * Login credentials
 * STRICT: Only @deped.gov.ph emails allowed
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Login result with success/error handling
 */
export interface LoginResult {
  success: boolean
  error?: string
  user?: User
}

/**
 * Logout result
 */
export interface LogoutResult {
  success: boolean
  error?: string
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  valid: boolean
  error?: string
}

export { type AuthError, type Session, type User } from '@supabase/supabase-js'
