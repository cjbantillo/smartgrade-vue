<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabase'

const user = ref<any>(null)

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  user.value = data.session?.user ?? null
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>SMARTGRADE</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="user" @click="supabase.auth.signOut()">Logout</v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <h1 class="text-h3 text-center my-8">Welcome to SmartGrade</h1>
        <p class="text-center">School Management System</p>

        <v-row justify="center" class="mt-8">
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Login / Register</v-card-title>
              <v-card-text>
                Use Supabase Auth (email/password or Google)
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>