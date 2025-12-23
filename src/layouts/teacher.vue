<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list>
        <v-list-item prepend-icon="mdi-school" title="Teacher Dashboard" />
      </v-list>

      <v-divider />

      <v-list nav>
        <v-list-item
          prepend-icon="mdi-google-classroom"
          title="My Classes"
          to="/teacher/classes"
          value="classes"
        />
        <v-list-item
          prepend-icon="mdi-clipboard-text"
          title="Grades"
          to="/teacher/grades"
          value="grades"
        />
        <v-list-item
          prepend-icon="mdi-certificate"
          title="Certificates"
          to="/teacher/certificates"
          value="certificates"
        />
        <v-list-item
          prepend-icon="mdi-file-document"
          title="Documents (SF9/SF10)"
          to="/teacher/documents"
          value="documents"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" elevation="1">
      <v-app-bar-title>SmartGrade - Teacher</v-app-bar-title>
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
