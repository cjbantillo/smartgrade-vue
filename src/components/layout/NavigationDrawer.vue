/** * Navigation Drawer Component * Shared sidebar navigation for role-based
layouts */

<template>
  <v-navigation-drawer
    :model-value="modelValue"
    :permanent="permanent"
    @update:model-value="$emit('update:model-value', $event)"
  >
    <!-- Header Section -->
    <v-list>
      <v-list-item :prepend-icon="headerIcon" :title="headerTitle" />
    </v-list>

    <v-divider />

    <!-- Navigation Items -->
    <v-list density="comfortable" nav>
      <v-list-item
        v-for="item in items"
        :key="item.value"
        exact
        :prepend-icon="item.icon"
        :title="item.title"
        :to="item.to"
        :value="item.value"
      />
    </v-list>

    <template #append>
      <v-divider />
      <v-list density="comfortable" nav>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Logout"
          value="logout"
          @click="$emit('logout')"
        />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
export interface NavigationItem {
  title: string;
  icon: string;
  to: string;
  value: string;
}

interface Props {
  headerTitle: string;
  headerIcon: string;
  items: NavigationItem[];
  permanent?: boolean;
  modelValue?: boolean;
}

withDefaults(defineProps<Props>(), {
  permanent: true,
  modelValue: true,
});

defineEmits<{
  "update:model-value": [value: boolean];
  logout: [];
}>();
</script>
