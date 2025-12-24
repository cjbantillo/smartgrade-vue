/** * Supabase Connection Test Page * * This page verifies that Supabase is
properly configured. * Navigate to /test-supabase to see the connection status.
* * THIS IS FOR DEVELOPMENT ONLY - Remove in production */

<route lang="yaml">
meta:
  layout: default
</route>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" lg="6" md="8">
        <v-card>
          <v-card-title class="text-h5 bg-primary">
            <v-icon class="mr-2" icon="mdi-database" />
            Supabase Connection Test
          </v-card-title>

          <v-card-text class="pt-6">
            <!-- Configuration Status -->
            <v-alert
              class="mb-4"
              :icon="isConfigured ? 'mdi-check-circle' : 'mdi-alert-circle'"
              prominent
              :type="isConfigured ? 'success' : 'error'"
            >
              <v-alert-title>
                {{
                  isConfigured
                    ? "Supabase Configured"
                    : "Supabase Not Configured"
                }}
              </v-alert-title>
              <div class="mt-2">
                {{
                  isConfigured
                    ? "Environment variables are properly set."
                    : "Please check your .env file and restart the dev server."
                }}
              </div>
            </v-alert>

            <!-- Connection Details -->
            <v-list>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-web" />
                </template>
                <v-list-item-title>Supabase URL</v-list-item-title>
                <v-list-item-subtitle>{{ supabaseUrl }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-key" />
                </template>
                <v-list-item-title>Anon Key</v-list-item-title>
                <v-list-item-subtitle>
                  {{ anonKeyStatus }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-package-variant" />
                </template>
                <v-list-item-title>Supabase Client</v-list-item-title>
                <v-list-item-subtitle>
                  {{ clientStatus }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <!-- Instructions -->
            <v-alert class="mt-4" type="info" variant="tonal">
              <v-alert-title>Next Steps</v-alert-title>
              <ul class="mt-2">
                <li>Copy <code>.env.example</code> to <code>.env</code></li>
                <li>
                  Get credentials from Supabase Dashboard → Settings → API
                </li>
                <li>
                  Update <code>.env</code> with your project URL and anon key
                </li>
                <li>Restart the dev server</li>
              </ul>
            </v-alert>
          </v-card-text>

          <v-card-actions>
            <v-btn prepend-icon="mdi-home" to="/"> Back to Home </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="reloadPage"
            >
              Reload
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import {
    getSupabaseUrl,
    isSupabaseConfigured,
    supabase,
  } from '@/services/supabase'

  const isConfigured = isSupabaseConfigured()
  const supabaseUrl = getSupabaseUrl()

  const anonKeyStatus = computed(() => {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!key) return '❌ Not configured'
    return `✅ Configured (${key.slice(0, 20)}...)`
  })

  const clientStatus = computed(() => {
    return supabase ? '✅ Client initialized' : '❌ Client not initialized'
  })

  function reloadPage () {
    window.location.reload()
  }
</script>
