<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list>
        <v-list-item prepend-icon="mdi-shield-crown" title="Admin Dashboard" />
      </v-list>

      <v-divider />

      <v-list nav>
        <v-list-item
          prepend-icon="mdi-account-group"
          title="User Management"
          to="/admin/users"
          value="users"
        />
        <v-list-item
          prepend-icon="mdi-school"
          title="School Years"
          to="/admin/school-years"
          value="school-years"
        />
        <v-list-item
          prepend-icon="mdi-cog"
          title="Settings"
          to="/admin/settings"
          value="settings"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" elevation="1">
      <v-app-bar-title>SmartGrade - Admin</v-app-bar-title>
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
