<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabase'

const user = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    user.value = data.session?.user ?? null
  } catch (err) {
    console.error('Auth error:', err)
  } finally {
    loading.value = false
  }

  // Real-time auth listener
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
})
</script>

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar app color="primary" dark elevation="4">
      <v-app-bar-title class="font-weight-black text-h5">
        SMARTGRADE
      </v-app-bar-title>
      <v-spacer />
      <v-btn v-if="user" text @click="supabase.auth.signOut()" class="mr-4">
        <v-icon left>mdi-logout</v-icon>
        Logout
      </v-btn>
      <span v-else class="subtitle-1 font-weight-medium">Guest Mode</span>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <router-view />

      <!-- Hero / Welcome Section -->
      <v-container fluid class="pa-0">
        <v-parallax
          height="600"
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
          dark
        >
          <v-row align="center" justify="center" class="fill-height">
            <v-col cols="12" md="8" lg="6" class="text-center">
              <h1 class="display-3 font-weight-black mb-6 white--text text-shadow">
                Welcome to SMARTGRADE
              </h1>
              <p class="display-1 font-weight-light white--text mb-8 text-shadow">
                DepEd-Compliant School Management System
              </p>

              <v-chip
                v-if="user"
                color="white"
                text-color="primary"
                large
                class="px-8 py-6 mb-8"
              >
                <v-icon left>mdi-account-circle</v-icon>
                Logged in as: <strong class="ml-2">{{ user.email }}</strong>
              </v-chip>

              <div class="mt-10">
                <v-btn
                  v-if="!user"
                  href="https://app.supabase.com"
                  target="_blank"
                  x-large
                  color="white"
                  class="mr-6 px-10 py-6"
                  elevation="10"
                >
                  <v-icon left large>mdi-login</v-icon>
                  Log In with Supabase
                </v-btn>

                <v-btn
                  to="/admin"
                  x-large
                  color="white"
                  outlined
                  class="px-10 py-6"
                  elevation="10"
                >
                  <v-icon left large>mdi-view-dashboard</v-icon>
                  View Admin Dashboard
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-parallax>
      </v-container>

      <!-- Features Section -->
      <v-container class="my-16">
        <h2 class="text-h4 text-center font-weight-bold mb-12 primary--text">
          Why Choose SMARTGRADE?
        </h2>

        <v-row>
          <v-col cols="12" md="4">
            <v-card class="pa-8 text-center" height="100%" elevation="12" hover>
              <v-icon size="80" color="primary" class="mb-6">mdi-file-document-check</v-icon>
              <h3 class="text-h5 font-weight-bold mb-4">DepEd-Compliant SF9</h3>
              <p class="grey--text text--darken-2">
                Official report card generation with versioning and audit trail
              </p>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="pa-8 text-center" height="100%" elevation="12" hover>
              <v-icon size="80" color="success" class="mb-6">mdi-shield-account</v-icon>
              <h3 class="text-h5 font-weight-bold mb-4">Secure Student View</h3>
              <p class="grey--text text--darken-2">
                Permanent watermark on student copies — no tampering possible
              </p>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="pa-8 text-center" height="100%" elevation="12" hover>
              <v-icon size="80" color="warning" class="mb-6">mdi-school</v-icon>
              <h3 class="text-h5 font-weight-bold mb-4">School Branding</h3>
              <p class="grey--text text--darken-2">
                Custom logo, school name, and principal signature on all documents
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Footer -->
      <v-footer color="primary" dark padless>
        <v-col class="text-center py-6">
          <strong>SMARTGRADE</strong> — Making Education Smarter, One Grade at a Time<br>
          © {{ new Date().getFullYear() }} • Built with ❤️ for Philippine Schools
        </v-col>
      </v-footer>
    </v-main>

    <!-- Loading Overlay -->
    <v-overlay :value="loading" opacity="0.9">
      <v-progress-circular indeterminate size="80" width="8" color="primary">
        Loading...
      </v-progress-circular>
    </v-overlay>
  </v-app>
</template>

<style scoped>
.text-shadow {
  text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.8);
}
</style>