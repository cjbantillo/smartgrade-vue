/**
 * Authentication Type Definitions
 * Types for Supabase Auth integration
 */

import type { Session, User } from '@supabase/supabase-js'
import type { UserRole } from './router'

/**
 * Re-export Supabase types for convenience
 */

/**
 * User Profile from profiles table
 */
export interface UserProfile {
  /** User ID (matches auth.users.id) */
  user_id: string
  /** Email address */
  email: string
  /** First name */
  first_name: string
  /** Last name */
  last_name: string
  /** Middle name */
  middle_name: string | null
  /** User role */
  role: UserRole
  /** Is account active */
  is_active: boolean
  /** Is account approved */
  is_approved: boolean
  /** Profile creation timestamp */
  created_at: string
  /** Profile update timestamp */
  updated_at: string
}

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Current authenticated user */
  user: User | null
  /** Current session */
  session: Session | null
  /** User profile with role */
  profile: UserProfile | null
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
