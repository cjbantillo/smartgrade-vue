<template>
  <v-card
    :class="[
      'text-center',
      'pa-8',
      variant === 'outlined' ? '' : 'elevation-0',
    ]"
    :color="backgroundColor"
    :variant="variant"
  >
    <v-icon :color="iconColor" :size="iconSize">
      {{ icon }}
    </v-icon>

    <h2 v-if="title" class="text-h5 mt-4 mb-2">
      {{ title }}
    </h2>

    <p v-if="text" class="text-body-1 text-medium-emphasis mb-4">
      {{ text }}
    </p>

    <slot name="description">
      <p v-if="description" class="text-body-2 text-medium-emphasis">
        {{ description }}
      </p>
    </slot>

    <div v-if="$slots.default || action" class="mt-4">
      <slot>
        <v-btn v-if="action" :color="actionColor" @click="$emit('action')">
          <v-icon v-if="actionIcon" class="mr-2">{{ actionIcon }}</v-icon>
          {{ action }}
        </v-btn>
      </slot>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";

export interface EmptyStateProps {
  icon?: string;
  iconSize?: number | string;
  iconColor?: string;
  title?: string;
  text?: string;
  description?: string;
  action?: string;
  actionIcon?: string;
  actionColor?: string;
  variant?: "flat" | "outlined" | "elevated";
  color?: "success" | "info" | "warning" | "error" | undefined;
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  icon: "mdi-information-outline",
  iconSize: 80,
  iconColor: "grey-lighten-1",
  variant: "flat",
  actionColor: "primary",
});

defineEmits<{
  action: [];
}>();

const backgroundColor = computed(() => {
  if (!props.color) return undefined;
  return `${props.color}-lighten-5`;
});
</script>
