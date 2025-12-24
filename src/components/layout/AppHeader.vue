/** * Shared Navigation Components * Reusable UI elements for layout consistency
across all user roles */

<template>
  <v-app-bar :color="color" elevation="1">
    <template v-if="showMenuToggle">
      <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />
    </template>

    <v-app-bar-title>
      <v-icon class="mr-2" :icon="icon" />
      {{ title }}
    </v-app-bar-title>

    <v-spacer />

    <slot name="actions">
      <!-- Placeholder for user menu - will be implemented with auth in Phase 2 -->
      <v-btn icon="mdi-bell-outline" title="Notifications" />
      <v-btn icon="mdi-account-circle" title="Profile" />
    </slot>
  </v-app-bar>
</template>

<script lang="ts" setup>
  interface Props {
    title: string
    icon?: string
    color?: string
    showMenuToggle?: boolean
  }

  withDefaults(defineProps<Props>(), {
    icon: 'mdi-school',
    color: 'primary',
    showMenuToggle: false,
  })

  defineEmits<{
    'toggle-drawer': []
  }>()
</script>
