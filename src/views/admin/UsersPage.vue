<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">User Management</h1>
            <p class="text-grey">Manage admins, teachers, and students</p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-account-plus"
            @click="openDialog()"
          >
            Add User
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search users"
              single-line
              hide-details
              density="compact"
              style="max-width: 300px"
            />
            <v-spacer />
            <v-select
              v-model="roleFilter"
              :items="['All', 'admin', 'adviser', 'teacher', 'student']"
              label="Filter by role"
              density="compact"
              hide-details
              style="max-width: 180px"
            />
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="filteredUsers"
            :search="search"
            :loading="loading"
            class="elevation-0"
          >
            <template #item.role="{ item }">
              <v-chip :color="roleColor(item.role)" size="small" label>
                {{ item.role }}
              </v-chip>
            </template>
            <template #item.is_active="{ item }">
              <v-icon :color="item.is_active ? 'success' : 'grey'">
                {{ item.is_active ? "mdi-check-circle" : "mdi-close-circle" }}
              </v-icon>
            </template>
            <template #item.actions="{ item }">
              <v-btn size="small" variant="text" icon @click="openDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                icon
                color="error"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{ editMode ? "Edit User" : "Add User" }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="valid">
            <v-text-field
              v-model="form.email"
              label="Email"
              type="email"
              :rules="[rules.required, rules.email]"
              density="comfortable"
            />
            <v-text-field
              v-model="form.first_name"
              label="First Name"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-text-field
              v-model="form.last_name"
              label="Last Name"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-select
              v-model="form.role"
              :items="['admin', 'adviser', 'teacher', 'student']"
              label="Role"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-text-field
              v-if="!editMode"
              v-model="form.password"
              label="Password"
              type="password"
              :rules="[rules.required, rules.minLength]"
              density="comfortable"
            />
            <v-switch v-model="form.is_active" label="Active" color="success" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!valid"
            @click="saveUser"
          >
            {{ editMode ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete User</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ userToDelete?.email }}</strong
          >? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteUser"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

const headers = [
  { title: "Email", key: "email" },
  { title: "First Name", key: "first_name" },
  { title: "Last Name", key: "last_name" },
  { title: "Role", key: "role" },
  { title: "Active", key: "is_active" },
  { title: "Actions", key: "actions", sortable: false },
];

const users = ref<User[]>([]);
const loading = ref(false);
const search = ref("");
const roleFilter = ref("All");

const dialog = ref(false);
const editMode = ref(false);
const formRef = ref();
const valid = ref(false);
const saving = ref(false);

const deleteDialog = ref(false);
const userToDelete = ref<User | null>(null);
const deleting = ref(false);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const form = ref({
  id: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "teacher",
  password: "",
  is_active: true,
});

const rules = {
  required: (v: string) => !!v || "Required",
  email: (v: string) => /.+@.+\..+/.test(v) || "Invalid email",
  minLength: (v: string) => (v && v.length >= 6) || "Min 6 characters",
};

const filteredUsers = computed(() => {
  if (roleFilter.value === "All") return users.value;
  return users.value.filter((u) => u.role === roleFilter.value);
});

function roleColor(role: string) {
  const colors: Record<string, string> = {
    admin: "error",
    adviser: "primary",
    teacher: "info",
    student: "success",
  };
  return colors[role] || "grey";
}

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

async function fetchUsers() {
  loading.value = true;
  const { data, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, role, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    notify(error.message, "error");
  } else {
    users.value = data || [];
  }
  loading.value = false;
}

function openDialog(user?: User) {
  if (user) {
    editMode.value = true;
    form.value = { ...user, password: "" };
  } else {
    editMode.value = false;
    form.value = {
      id: "",
      email: "",
      first_name: "",
      last_name: "",
      role: "teacher",
      password: "",
      is_active: true,
    };
  }
  dialog.value = true;
}

async function saveUser() {
  if (!valid.value) return;
  saving.value = true;

  if (editMode.value) {
    const { error } = await supabase
      .from("users")
      .update({
        email: form.value.email,
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        role: form.value.role,
        is_active: form.value.is_active,
      })
      .eq("id", form.value.id);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("User updated");
      dialog.value = false;
      fetchUsers();
    }
  } else {
    // Create user via Supabase Auth + insert profile
    const { data, error } = await supabase.auth.admin.createUser({
      email: form.value.email,
      password: form.value.password,
      email_confirm: true,
    });

    if (error) {
      notify(error.message, "error");
    } else if (data.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email: form.value.email,
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        role: form.value.role,
        is_active: form.value.is_active,
      });

      if (profileError) {
        notify(profileError.message, "error");
      } else {
        notify("User created");
        dialog.value = false;
        fetchUsers();
      }
    }
  }
  saving.value = false;
}

function confirmDelete(user: User) {
  userToDelete.value = user;
  deleteDialog.value = true;
}

async function deleteUser() {
  if (!userToDelete.value) return;
  deleting.value = true;

  // Soft delete by setting is_active = false
  const { error } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", userToDelete.value.id);

  if (error) {
    notify(error.message, "error");
  } else {
    notify("User deactivated");
    deleteDialog.value = false;
    fetchUsers();
  }
  deleting.value = false;
}

onMounted(fetchUsers);
</script>
