/** * Home Page * Redirects to appropriate dashboard based on authentication
status * - Unauthenticated → /login * - Authenticated → Role-specific dashboard
*/

<template>
  <div
    class="d-flex flex-column align-center justify-center"
    style="min-height: 80vh"
  >
    <v-progress-circular color="primary" indeterminate size="64" />
    <p class="text-h6 text-medium-emphasis mt-6">Loading SmartGrade...</p>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  // Initialize auth store if needed
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  // Check authentication status
  if (!authStore.isAuthenticated) {
    // Not authenticated → redirect to login
    router.replace("/login");
    return;
  }

  // Authenticated → redirect based on role
  const role = authStore.userRole;
  switch (role) {
    case "admin":
      router.replace("/admin");
      break;
    case "teacher":
      router.replace("/teacher");
      break;
    case "student":
      router.replace("/student");
      break;
    default:
      // Role not recognized → redirect to login
      router.replace("/login");
  }
});
</script>
