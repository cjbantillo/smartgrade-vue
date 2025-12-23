<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list>
        <v-list-item prepend-icon="mdi-account-school" title="Student Portal" />
      </v-list>

      <v-divider />

      <v-list nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          to="/student/dashboard"
          value="dashboard"
        />
        <v-list-item
          prepend-icon="mdi-clipboard-text"
          title="My Grades"
          to="/student/grades"
          value="grades"
        />
        <v-list-item
          prepend-icon="mdi-trophy"
          title="Honors & Awards"
          to="/student/honors"
          value="honors"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" elevation="1">
      <v-app-bar-title>SmartGrade - Student</v-app-bar-title>
      <v-spacer />
      <v-btn icon="mdi-account-circle" />
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
//
</script>
