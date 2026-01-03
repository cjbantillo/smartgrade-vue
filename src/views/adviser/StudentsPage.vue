<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My Students</h1>
        <p class="text-body-1 text-grey-darken-1">
          View students in your sections.
        </p>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSection"
          :items="sections"
          item-title="name"
          item-value="section_id"
          label="Select Section"
          variant="outlined"
          @update:model-value="loadStudents"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-text>
            <v-table v-if="students.length">
              <thead>
                <tr>
                  <th>LRN</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.student_id">
                  <td>{{ student.lrn }}</td>
                  <td>{{ student.first_name }} {{ student.last_name }}</td>
                  <td>
                    <v-chip color="success" size="small">Active</v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-6 text-grey">
              Select a section to view students.
            </div>
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

const sections = ref<{ section_id: number; name: string }[]>([]);
const students = ref<
  {
    student_id: number;
    lrn: string;
    first_name: string;
    last_name: string;
  }[]
>([]);
const selectedSection = ref<number | null>(null);

onMounted(async () => {
  await loadSections();
});

async function loadSections() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  const { data: teacher } = await supabase
    .from("teachers")
    .select("teacher_id")
    .eq("user_id", userId)
    .single();

  if (!teacher) return;

  const { data } = await supabase
    .from("sections")
    .select("section_id, name")
    .eq("adviser_teacher_id", teacher.teacher_id);

  sections.value = data || [];
}

async function loadStudents() {
  if (!selectedSection.value) return;

  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      student_id,
      students(student_id, lrn, first_name, last_name)
    `
    )
    .eq("section_subject_id", selectedSection.value);

  const seen = new Set();
  students.value = (data || [])
    .filter((e: any) => {
      if (seen.has(e.student_id)) return false;
      seen.add(e.student_id);
      return true;
    })
    .map((e: any) => ({
      student_id: e.students?.student_id || e.student_id,
      lrn: e.students?.lrn || "",
      first_name: e.students?.first_name || "",
      last_name: e.students?.last_name || "",
    }));
}
</script>
