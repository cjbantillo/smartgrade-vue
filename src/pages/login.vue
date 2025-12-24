/** * Login Page * STRICT email-only authentication (@deped.gov.ph) * * PHASE 3
Rules: * - Only @deped.gov.ph emails allowed * - No username field * - No signup
option (admin creates users) * - Email and password only */

<route lang="yaml">
meta:
  layout: default
</route>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" lg="4" md="6">
        <!-- Header -->
        <div class="text-center mb-8">
          <v-icon class="mb-4" color="primary" size="80"> mdi-school </v-icon>
          <h1 class="text-h4 mb-2">SmartGrade</h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Ampayon National High School
          </p>
        </div>

        <!-- Login Card -->
        <v-card elevation="4">
          <v-card-title class="bg-primary text-center py-4">
            <span class="text-h5">Login</span>
          </v-card-title>

          <v-card-text class="pa-6">
            <!-- Error Alert -->
            <v-alert
              v-if="errorMessage"
              class="mb-4"
              closable
              type="error"
              variant="tonal"
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>

            <!-- Login Form -->
            <v-form ref="formRef" @submit.prevent="handleLogin">
              <!-- Email/LRN Field -->
              <v-text-field
                v-model="email"
                autocomplete="username"
                clearable
                :disabled="isLoading"
                :error-messages="emailErrors"
                label="Email or LRN (Students)"
                placeholder="email@deped.gov.ph or 123456789012"
                prepend-inner-icon="mdi-account"
                required
                :rules="emailRules"
                variant="outlined"
                @blur="validateEmail"
              />

              <!-- Password Field -->
              <v-text-field
                v-model="password"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="current-password"
                class="mt-2"
                :disabled="isLoading"
                label="Password"
                prepend-inner-icon="mdi-lock"
                required
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPassword = !showPassword"
              />

              <!-- Remember Info -->
              <v-alert
                class="my-4"
                color="info"
                density="compact"
                variant="tonal"
              >
                <div class="text-caption">
                  <v-icon size="small">mdi-information</v-icon>
                  Admin/Teacher: Use @deped.gov.ph email • Students: Use email
                  or 12-digit LRN
                </div>
              </v-alert>

              <!-- Login Button -->
              <v-btn
                block
                class="mt-4"
                color="primary"
                :loading="isLoading"
                size="large"
                type="submit"
              >
                <v-icon class="mr-2">mdi-login</v-icon>
                Login
              </v-btn>
            </v-form>
          </v-card-text>

          <!-- Footer -->
          <v-card-text
            class="text-center text-caption text-medium-emphasis pt-0"
          >
            <v-divider class="mb-4" />
            Don't have an account? Contact your system administrator.
          </v-card-text>
        </v-card>

        <!-- Test Credentials (Development Only) -->
        <v-card v-if="isDevelopment" class="mt-4" variant="outlined">
          <v-card-text class="text-caption">
            <strong>Development Mode</strong><br />
            This section will be removed in production
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth, validateDepEdEmail } from "@/composables/useAuth";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const { login, loading: authLoading } = useAuth();

// Form state
const formRef = ref();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const errorMessage = ref("");
const emailErrors = ref<string[]>([]);

// Loading state
const isLoading = computed(() => authLoading.value);

// Development mode check
const isDevelopment = import.meta.env.DEV;

// Validation rules
const emailRules = [
  (v: string) => !!v || "Email is required",
  (v: string) => {
    const validation = validateDepEdEmail(v);
    return validation.valid || validation.error || "Invalid email";
  },
];

const passwordRules = [
  (v: string) => !!v || "Password is required",
  (v: string) => v.length >= 6 || "Password must be at least 6 characters",
];

/**
 * Validate email on blur
 */
function validateEmail() {
  emailErrors.value = [];
  if (!email.value) return;

  const validation = validateDepEdEmail(email.value);
  if (!validation.valid && validation.error) {
    emailErrors.value = [validation.error];
  }
}

/**
 * Handle login submission
 */
async function handleLogin() {
  errorMessage.value = "";
  emailErrors.value = [];

  // Validate form
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // Attempt login
  const result = await login({
    email: email.value,
    password: password.value,
  });

  if (result.success && result.user) {
    // Get current session for store
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // setUser will fetch profile and role
      await authStore.setUser(result.user, session);

      // Redirect based on user role
      const role = authStore.userRole;
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "teacher") {
        router.push("/teacher");
      } else if (role === "student") {
        router.push("/student");
      } else {
        // Fallback to home if role not recognized
        router.push("/");
      }
    }
  } else {
    errorMessage.value = result.error || "Login failed";
  }
}
</script>
