/** * Footer Component * Shared footer across all layouts */

<template>
  <v-footer app class="bg-grey-lighten-4">
    <v-row justify="center" no-gutters>
      <v-col class="text-center py-2" cols="12">
        <span class="text-body-2 text-medium-emphasis">
          &copy; {{ currentYear }} SmartGrade - Ampayon National High School
        </span>
        <span class="mx-2">•</span>
        <span class="text-body-2 text-medium-emphasis">
          Senior High School Automated Grading System
        </span>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const currentYear = computed(() => new Date().getFullYear());
</script>
