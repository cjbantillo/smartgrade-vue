<template>
  <v-alert
    :type="severity"
    :variant="variant"
    :closable="closable"
    :prominent="prominent"
    class="mb-4"
    @click:close="$emit('close')"
  >
    <template v-if="title" #title>
      <div class="d-flex align-center">
        <span>{{ title }}</span>
        <v-chip v-if="retryable" class="ml-2" color="info" size="x-small">
          Retryable
        </v-chip>
      </div>
    </template>

    <div v-if="message" class="mb-2">
      {{ message }}
    </div>

    <slot />

    <div v-if="technical && showTechnical" class="mt-2">
      <v-divider class="my-2" />
      <details>
        <summary class="text-caption cursor-pointer">Technical Details</summary>
        <pre class="text-caption mt-2 pa-2 bg-grey-lighten-4 rounded">{{
          technical
        }}</pre>
      </details>
    </div>

    <div v-if="retryable || action" class="mt-3">
      <v-btn
        v-if="retryable"
        :color="severity === 'error' ? 'error' : 'primary'"
        :loading="retrying"
        prepend-icon="mdi-refresh"
        size="small"
        variant="tonal"
        @click="handleRetry"
      >
        Retry
      </v-btn>

      <v-btn
        v-if="action"
        :color="actionColor"
        class="ml-2"
        size="small"
        variant="tonal"
        @click="$emit('action')"
      >
        {{ action }}
      </v-btn>
    </div>
  </v-alert>
</template>

<script lang="ts" setup>
import { ref } from "vue";

export interface ErrorDisplayProps {
  title?: string;
  message?: string;
  technical?: string;
  severity?: "error" | "warning" | "info" | "success";
  variant?: "tonal" | "outlined" | "flat" | "elevated";
  retryable?: boolean;
  action?: string;
  actionColor?: string;
  closable?: boolean;
  prominent?: boolean;
  showTechnical?: boolean;
}

withDefaults(defineProps<ErrorDisplayProps>(), {
  severity: "error",
  variant: "tonal",
  retryable: false,
  closable: true,
  prominent: false,
  showTechnical: false,
  actionColor: "primary",
});

const emit = defineEmits<{
  retry: [];
  action: [];
  close: [];
}>();

const retrying = ref(false);

async function handleRetry() {
  retrying.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay for UX
    emit("retry");
  } finally {
    retrying.value = false;
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
