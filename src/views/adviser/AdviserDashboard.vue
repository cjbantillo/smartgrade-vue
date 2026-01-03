<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">Adviser Dashboard</h1>
        <p class="text-body-1 text-grey-darken-1">
          Manage your sections and students.
        </p>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card elevation="4" class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey-darken-1">
                {{ stat.title }}
              </div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
            </div>
            <v-avatar :color="stat.color" size="44" variant="tonal">
              <v-icon>{{ stat.icon }}</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card elevation="4">
          <v-card-title>My Sections</v-card-title>
          <v-card-text>
            <v-table v-if="sections.length">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="section in sections" :key="section.section_id">
                  <td>{{ section.name }}</td>
                  <td>{{ section.student_count }}</td>
                  <td>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="tonal"
                      :to="`/adviser/grades?section=${section.section_id}`"
                    >
                      Grades
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-6 text-grey">
              No sections assigned.
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="4">
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text class="d-flex flex-column gap-2">
            <v-btn
              block
              color="primary"
              prepend-icon="mdi-clipboard-text"
              to="/adviser/grades"
            >
              Encode Grades
            </v-btn>
            <v-btn
              block
              color="secondary"
              prepend-icon="mdi-file-document"
              to="/adviser/documents"
            >
              Generate SF9
            </v-btn>
            <v-btn
              block
              variant="outlined"
              prepend-icon="mdi-account-school"
              to="/adviser/students"
            >
              View Students
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const authStore = useAuthStore();

interface Section {
  section_id: number;
  name: string;
  student_count: number;
}

const sections = ref<Section[]>([]);
const stats = ref([
  {
    title: "My Sections",
    value: "0",
    icon: "mdi-google-classroom",
    color: "primary",
  },
  {
    title: "Total Students",
    value: "0",
    icon: "mdi-account-group",
    color: "success",
  },
  {
    title: "Pending Grades",
    value: "0",
    icon: "mdi-clipboard-alert",
    color: "warning",
  },
  { title: "Documents", value: "0", icon: "mdi-file-document", color: "info" },
]);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  // Get teacher_id
  const { data: teacher } = await supabase
    .from("teachers")
    .select("teacher_id")
    .eq("user_id", userId)
    .single();

  if (!teacher) return;

  // Get sections
  const { data: sectionData } = await supabase
    .from("sections")
    .select("section_id, name")
    .eq("adviser_teacher_id", teacher.teacher_id);

  if (sectionData) {
    sections.value = sectionData.map((s) => ({
      section_id: s.section_id,
      name: s.name,
      student_count: 0,
    }));
  }

  stats.value[0].value = String(sections.value.length);

  // Count students across sections
  let totalStudents = 0;
  for (const section of sections.value) {
    const { data: sectionSubjects } = await supabase
      .from("section_subjects")
      .select("section_subject_id")
      .eq("section_id", section.section_id);

    if (sectionSubjects && sectionSubjects.length > 0) {
      const ssIds = sectionSubjects.map((ss) => ss.section_subject_id);
      const { count } = await supabase
        .from("enrollments")
        .select("student_id", { count: "exact", head: true })
        .in("section_subject_id", ssIds);

      section.student_count = count ?? 0;
      totalStudents += section.student_count;
    }
  }

  stats.value[1].value = String(totalStudents);
}
</script>
