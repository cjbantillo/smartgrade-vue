<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="12" class="pa-6">
          <div class="text-center mb-6">
            <v-avatar color="primary" size="64" class="mb-4">
              <v-icon size="36" color="white">mdi-school</v-icon>
            </v-avatar>
            <h1 class="text-h5 font-weight-bold">SMARTGRADE</h1>
            <p class="text-body-2 text-grey">Sign in to continue</p>
          </div>

          <v-form ref="formRef" v-model="valid" @submit.prevent="handleLogin">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-model="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
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
              Sign In
            </v-btn>
          </v-form>

          <v-divider class="my-6">
            <span class="text-grey px-2">or</span>
          </v-divider>

          <v-btn
            variant="outlined"
            block
            size="large"
            prepend-icon="mdi-google"
            :loading="googleLoading"
            @click="handleGoogleLogin"
          >
            Continue with Google
          </v-btn>

          <div class="text-center mt-6">
            <p class="text-caption text-grey">Demo Credentials:</p>
            <p class="text-caption">Admin: admin@deped.gov.ph / admin123</p>
            <p class="text-caption">
              Teacher: teacher1@deped.gov.ph / teacher123
            </p>
            <p class="text-caption">
              Student: kirstein.nojapa@gmail.com / password
            </p>
          </div>
        </v-card>
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
  if (role === "admin") router.push("/admin");
  else if (role === "teacher" || role === "adviser") router.push("/adviser");
  else if (role === "student") router.push("/student");
  else router.push("/");
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
  googleLoading.value = false;

  if (!result.success) {
    showError(result.error || "Google login failed");
  }
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
