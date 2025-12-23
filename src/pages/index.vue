<template>
  <div
    class="d-flex flex-column align-center justify-center"
    style="min-height: 80vh"
  >
    <v-icon size="120" color="primary" class="mb-6"> mdi-school </v-icon>

    <h1 class="text-h3 mb-4">SmartGrade</h1>
    <p class="text-h6 text-medium-emphasis mb-8">
      Automated Grading System for Ampayon National High School - Senior High
      School
    </p>

    <v-card class="pa-6" max-width="600">
      <v-card-title class="text-h5 mb-4">Quick Access</v-card-title>

      <v-row>
        <v-col cols="12" md="4">
          <v-btn
            block
            size="large"
            color="primary"
            prepend-icon="mdi-shield-crown"
            to="/admin"
          >
            Admin
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn
            block
            size="large"
            color="primary"
            prepend-icon="mdi-school"
            to="/teacher"
          >
            Teacher
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn
            block
            size="large"
            color="primary"
            prepend-icon="mdi-account-school"
            to="/student"
          >
            Student
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
//
</script>
