<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <v-icon size="120" color="warning" class="mb-6"
          >mdi-alert-circle</v-icon
        >
        <h1 class="text-h2 font-weight-bold mb-4">404</h1>
        <p class="text-h5 text-grey-darken-1 mb-8">Page Not Found</p>
        <v-btn color="primary" size="large" to="/" prepend-icon="mdi-home">
          Back to Home
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts"></script>

<style scoped>
.fill-height {
  min-height: 80vh;
}
</style>
