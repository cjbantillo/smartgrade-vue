/**
 * Supabase Client Configuration
 *
 * This module provides a configured Supabase client for the SmartGrade application.
 *
 * PHASE 2: Basic client setup only
 * - No queries implemented yet
 * - No auth logic yet
 * - Safe, minimal configuration
 *
 * GLOBAL RULES (from copilot-instructions.md):
 * - No hardcoded credentials (uses environment variables)
 * - Supabase Auth is the ONLY authentication provider
 * - All roles come from the profiles table
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. Please check your .env file.',
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.',
  )
}

/**
 * Supabase client instance
 *
 * Configuration:
 * - Uses environment variables for security
 * - Singleton pattern (created once, reused everywhere)
 * - No custom configuration needed for Phase 2
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Auth configuration will be expanded in future phases
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
)

/**
 * Helper to check if Supabase is properly configured
 * Useful for debugging and health checks
 */
export function isSupabaseConfigured (): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Get the current Supabase URL (for debugging)
 * Returns masked URL for security
 */
export function getSupabaseUrl (): string {
  if (!supabaseUrl) {
    return 'Not configured'
  }

  try {
    const url = new URL(supabaseUrl)
    return `${url.protocol}//${url.hostname}`
  } catch {
    return 'Invalid URL'
  }
}

// Export types for use in other modules

export { type SupabaseClient } from '@supabase/supabase-js'
