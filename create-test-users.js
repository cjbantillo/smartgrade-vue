/**
 * Test User Creation Script
 * Creates admin, teacher, and student test accounts
 *
 * Run this from browser console or Node.js
 */

import { supabase } from './src/services/supabase'

const TEST_USERS = [
  {
    email: 'admin@deped.gov.ph',
    password: 'admin123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'teacher@deped.gov.ph',
    password: 'teacher123',
    role: 'teacher',
    firstName: 'Teacher',
    lastName: 'User',
  },
  {
    email: 'student@example.com',
    password: 'student123',
    role: 'student',
    firstName: 'Student',
    lastName: 'User',
  },
]

async function createTestUsers () {
  console.log('Creating test users...')

  for (const user of TEST_USERS) {
    console.log(`\nCreating ${user.role}: ${user.email}`)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            first_name: user.firstName,
            last_name: user.lastName,
          },
        },
      })

      if (authError) {
        console.error(`❌ Auth error for ${user.email}:`, authError.message)
        continue
      }

      if (!authData.user) {
        console.error(`❌ No user returned for ${user.email}`)
        continue
      }

      console.log(`✅ Created auth user: ${authData.user.id}`)

      // Create profile with role
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: authData.user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        is_active: true,
        is_approved: true,
      })

      if (profileError) {
        console.error(
          `❌ Profile error for ${user.email}:`,
          profileError.message,
        )
      } else {
        console.log(`✅ Created profile with role: ${user.role}`)
      }
    } catch (error) {
      console.error(`❌ Exception for ${user.email}:`, error)
    }
  }

  console.log('\n✅ Test user creation complete!')
}

// Export for use in browser or Node
if (typeof window === 'undefined') {
  // Node environment
  createTestUsers().then(() => process.exit(0))
} else {
  // Browser environment
  window.createTestUsers = createTestUsers
  console.log('Run: createTestUsers()')
}
