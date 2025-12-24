<template>
  <v-dialog v-model="show" max-width="400" persistent>
    <v-card>
      <v-card-title class="bg-warning text-white">
        <v-icon class="mr-2">mdi-content-save-alert</v-icon>
        Unsaved Changes
      </v-card-title>

      <v-card-text class="pt-4">
        <p>You have unsaved changes. What would you like to do?</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleStay"> Stay on Page </v-btn>
        <v-btn color="error" variant="outlined" @click="handleDiscard">
          Discard Changes
        </v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSave">
          Save & Leave
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

export interface UnsavedChangesDialogProps {
  modelValue: boolean;
}

const props = defineProps<UnsavedChangesDialogProps>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [];
  discard: [];
  stay: [];
}>();

const saving = ref(false);

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

async function handleSave() {
  saving.value = true;
  try {
    emit("save");
  } finally {
    // Keep loading state - parent will close dialog after save
    setTimeout(() => {
      saving.value = false;
    }, 300);
  }
}

function handleDiscard() {
  emit("discard");
  show.value = false;
}

function handleStay() {
  emit("stay");
  show.value = false;
}
</script>
