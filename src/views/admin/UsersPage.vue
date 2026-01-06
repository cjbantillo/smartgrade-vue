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
              :items="['All', 'ADMIN', 'TEACHER', 'STUDENT']"
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
            <template #[`item.role`]="{ item }">
              <v-chip :color="roleColor(item.role)" size="small" label>
                {{ item.role }}
              </v-chip>
            </template>
            <template #[`item.is_active`]="{ item }">
              <v-icon :color="item.is_active ? 'success' : 'grey'">
                {{ item.is_active ? "mdi-check-circle" : "mdi-close-circle" }}
              </v-icon>
            </template>
            <template #[`item.actions`]="{ item }">
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
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="form.first_name"
                  label="First Name"
                  :rules="[rules.required]"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="form.last_name"
                  label="Last Name"
                  :rules="[rules.required]"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <v-select
              v-model="form.role"
              :items="['ADMIN', 'TEACHER', 'STUDENT']"
              label="Role"
              :rules="[rules.required]"
              density="comfortable"
            />
            <!-- Student-specific fields -->
            <v-text-field
              v-if="form.role === 'STUDENT'"
              v-model="form.lrn"
              label="LRN (Learner Reference Number)"
              density="comfortable"
            />
            <!-- Teacher-specific fields -->
            <v-text-field
              v-if="form.role === 'TEACHER'"
              v-model="form.employee_no"
              label="Employee Number"
              density="comfortable"
            />
            <v-text-field
              v-if="!editMode"
              v-model="form.password"
              label="Password"
              type="password"
              :rules="[rules.required, rules.minLength]"
              density="comfortable"
              hint="Use: admin123, teacher123, or password"
              persistent-hint
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
  user_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
  school_id: number;
  lrn: string | null;
  employee_no: string | null;
}

const headers = [
  { title: "Email", key: "email" },
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
  user_id: 0,
  email: "",
  first_name: "",
  last_name: "",
  role: "TEACHER",
  password: "",
  is_active: true,
  school_id: 1,
  lrn: "",
  employee_no: "",
});

const rules = {
  required: (v: string) => !!v || "Required",
  email: (v: string) => /.+@.+\..+/.test(v) || "Invalid email",
  minLength: (v: string) => (v && v.length >= 6) || "Min 6 characters",
};

const filteredUsers = computed(() => {
  if (roleFilter.value === "All") return users.value;
  return users.value.filter(
    (u) => u.role.toLowerCase() === roleFilter.value.toLowerCase()
  );
});

function roleColor(role: string) {
  const colors: Record<string, string> = {
    ADMIN: "error",
    TEACHER: "info",
    STUDENT: "success",
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

  // Fetch users with related teacher/student data
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      user_id, 
      email, 
      role, 
      is_active, 
      school_id,
      teachers (first_name, last_name, employee_no),
      students (first_name, last_name, lrn)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    notify(error.message, "error");
  } else {
    // Transform data to flatten teacher/student fields
    users.value = (data || []).map((user: any) => {
      const teacher = user.teachers?.[0];
      const student = user.students?.[0];
      return {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        school_id: user.school_id,
        first_name: teacher?.first_name || student?.first_name || null,
        last_name: teacher?.last_name || student?.last_name || null,
        employee_no: teacher?.employee_no || null,
        lrn: student?.lrn || null,
      };
    });
  }
  loading.value = false;
}

function openDialog(user?: User) {
  if (user) {
    editMode.value = true;
    form.value = {
      ...user,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      lrn: user.lrn || "",
      employee_no: user.employee_no || "",
    };
  } else {
    editMode.value = false;
    form.value = {
      user_id: 0,
      email: "",
      first_name: "",
      last_name: "",
      role: "TEACHER",
      password: "",
      is_active: true,
      school_id: 1,
      lrn: "",
      employee_no: "",
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
        role: form.value.role,
        is_active: form.value.is_active,
      })
      .eq("user_id", form.value.user_id);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("User updated");
      dialog.value = false;
      fetchUsers();
    }
  } else {
    // Create user directly in users table
    // Using a simple hash for demo - in production, use bcrypt on server-side
    const passwordHashes: Record<string, string> = {
      admin123: "$2a$10$N9qo8uLOickgx2ZMRZoMye1e5HG8X5h7kJBZN3g1lJ.k8QOvZ7rCi",
      teacher123:
        "$2a$10$YQ8DGrT8tKNpqIwvCy3kZeGzVb5sY9nGxGvYkH5XvQ1hLY8fSdZbO",
      password: "$2a$10$e0MYzXyjpJS7Pd0RVvHwHeNpPj.VmZGHbKo.E8cJvAYOdDZ.1Tn.i",
    };

    // Default to 'password' hash if the password doesn't match known ones
    const passwordHash =
      passwordHashes[form.value.password] || passwordHashes["password"];

    // Step 1: Create user in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        email: form.value.email.toLowerCase().trim(),
        role: form.value.role,
        password_hash: passwordHash,
        is_active: form.value.is_active,
        school_id: form.value.school_id,
      })
      .select("user_id")
      .single();

    if (userError) {
      notify(userError.message, "error");
      saving.value = false;
      return;
    }

    // Step 2: Create corresponding record in teachers or students table
    if (form.value.role === "TEACHER") {
      const { error: teacherError } = await supabase.from("teachers").insert({
        user_id: userData.user_id,
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        employee_no: form.value.employee_no || null,
        is_active: true,
      });

      if (teacherError) {
        notify(
          `User created but teacher profile failed: ${teacherError.message}`,
          "warning"
        );
      } else {
        notify("User and teacher profile created successfully");
      }
    } else if (form.value.role === "STUDENT") {
      const { error: studentError } = await supabase.from("students").insert({
        user_id: userData.user_id,
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        lrn: form.value.lrn || null,
        status: "active",
      });

      if (studentError) {
        notify(
          `User created but student profile failed: ${studentError.message}`,
          "warning"
        );
      } else {
        notify("User and student profile created successfully");
      }
    } else {
      // ADMIN - no additional profile needed
      notify("Admin user created successfully");
    }

    dialog.value = false;
    fetchUsers();
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
    .eq("user_id", userToDelete.value.user_id);

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
