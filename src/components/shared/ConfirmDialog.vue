<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card>
      <v-card-title :class="titleClass">
        <v-icon class="mr-2">{{ icon }}</v-icon>
        {{ title }}
      </v-card-title>

      <v-card-text class="pt-4">
        <v-alert v-if="warning" class="mb-4" type="warning" variant="tonal">
          <strong>{{ warning }}</strong>
        </v-alert>

        <div v-if="message" class="mb-3">
          {{ message }}
        </div>

        <slot />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          :loading="confirming"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

export interface ConfirmDialogProps {
  modelValue: boolean;
  title?: string;
  message?: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  type?: "info" | "warning" | "error" | "success";
  icon?: string;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  title: "Confirm Action",
  confirmText: "Confirm",
  cancelText: "Cancel",
  confirmColor: "primary",
  type: "info",
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const confirming = ref(false);

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const titleClass = computed(() => {
  const baseClass = "text-white";
  switch (props.type) {
    case "warning":
      return `${baseClass} bg-warning`;
    case "error":
      return `${baseClass} bg-error`;
    case "success":
      return `${baseClass} bg-success`;
    default:
      return `${baseClass} bg-primary`;
  }
});

const icon = computed(() => {
  if (props.icon) return props.icon;

  switch (props.type) {
    case "warning":
      return "mdi-alert";
    case "error":
      return "mdi-alert-circle";
    case "success":
      return "mdi-check-circle";
    default:
      return "mdi-information";
  }
});

async function handleConfirm() {
  confirming.value = true;
  try {
    emit("confirm");
  } finally {
    // Keep loading state - parent will close dialog
    setTimeout(() => {
      confirming.value = false;
    }, 300);
  }
}

function handleCancel() {
  emit("cancel");
  show.value = false;
}
</script>
