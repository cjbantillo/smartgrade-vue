<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card elevation="12" class="rounded-lg">
          <v-card-title class="text-center pa-6 bg-primary">
            <div class="d-flex flex-column align-center">
              <v-icon size="56" color="white" class="mb-2">mdi-school</v-icon>
              <span class="text-h5 font-weight-bold white--text"
                >SMARTGRADE</span
              >
              <span class="text-caption white--text"
                >DepEd-Compliant School Management</span
              >
            </div>
          </v-card-title>

          <v-card-text class="pa-6">
            <v-form ref="formRef" v-model="valid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.email]"
                class="mb-2"
              />

              <v-text-field
                v-model="password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                class="mb-4"
              />

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="authStore.loading"
                :disabled="!valid"
              >
                <v-icon left>mdi-login</v-icon>
                Sign In
              </v-btn>
            </v-form>

            <v-divider class="my-6">
              <span class="text-grey px-2">or continue with</span>
            </v-divider>

            <v-btn
              variant="outlined"
              block
              size="large"
              @click="handleGoogleLogin"
              :loading="googleLoading"
            >
              <v-icon left color="red">mdi-google</v-icon>
              Sign in with Google
            </v-btn>
          </v-card-text>
        </v-card>

        <div class="text-center mt-6 text-grey-darken-1">
          <v-icon size="16">mdi-shield-check</v-icon>
          Secure login powered by Supabase
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const formRef = ref();
const valid = ref(false);
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const googleLoading = ref(false);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("error");

const rules = {
  required: (v: string) => !!v || "Required",
  email: (v: string) => /.+@.+\..+/.test(v) || "Invalid email",
};

function showError(message: string) {
  snackbarText.value = message;
  snackbarColor.value = "error";
  snackbar.value = true;
}

function redirectByRole() {
  const role = authStore.role;
  if (role === "admin") {
    router.push("/admin");
  } else if (role === "adviser" || role === "teacher") {
    router.push("/adviser");
  } else if (role === "student") {
    router.push("/student");
  } else {
    router.push("/");
  }
}

async function handleLogin() {
  if (!valid.value) return;

  const result = await authStore.signInWithEmail(email.value, password.value);
  if (result.success) {
    redirectByRole();
  } else {
    showError(result.error || "Login failed");
  }
}

async function handleGoogleLogin() {
  googleLoading.value = true;
  const result = await authStore.signInWithGoogle();
  if (!result.success) {
    showError(result.error || "Google login failed");
  }
  googleLoading.value = false;
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
}
</style>
