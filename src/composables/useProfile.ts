/**
 * User Profile Composable
 * Handles fetching and managing user profiles from Supabase
 *
 * PHASE 4: Role-based access
 * - Fetch profile from profiles table
 * - Resolve user role
 * - Used by auth store to populate profile data
 */

import type { UserProfile } from '@/types/auth'

import { ref } from 'vue'

import { supabase } from '@/services/supabase'

/**
 * Profile fetch result
 */
export interface ProfileResult {
  success: boolean
  error?: string
  profile?: UserProfile
}

/**
 * Profile composable for fetching user data
 */
export function useProfile () {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch user profile by user ID
   * Queries the profiles table for role and user info
   */
  async function fetchProfile (userId: string): Promise<ProfileResult> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        error.value = 'Failed to fetch user profile'
        console.error('[Profile] Fetch error:', fetchError)
        return {
          success: false,
          error: error.value,
        }
      }

      if (!data) {
        error.value = 'Profile not found'
        return {
          success: false,
          error: error.value,
        }
      }

      // Validate that profile has required role field
      if (!data.role) {
        error.value = 'User role not set. Contact administrator.'
        console.error('[Profile] Missing role for user:', userId)
        return {
          success: false,
          error: error.value,
        }
      }

      return {
        success: true,
        profile: data as UserProfile,
      }
    } catch (error_) {
      const message
        = error_ instanceof Error ? error_.message : 'Unknown error occurred'
      error.value = message
      console.error('[Profile] Exception:', error_)
      return {
        success: false,
        error: message,
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user has a specific role
   */
  function hasRole (
    profile: UserProfile | null,
    role: string | string[],
  ): boolean {
    if (!profile) {
      return false
    }

    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(profile.role)
  }

  return {
    loading,
    error,
    fetchProfile,
    hasRole,
  }
}
