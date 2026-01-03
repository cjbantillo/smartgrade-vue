<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">Document Center</h1>
        <p class="text-body-1 text-grey-darken-1">
          Generate and manage SF9 documents.
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
                  <th>SF9 Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.student_id">
                  <td>{{ student.lrn }}</td>
                  <td>{{ student.first_name }} {{ student.last_name }}</td>
                  <td>
                    <v-chip
                      :color="student.has_sf9 ? 'success' : 'grey'"
                      size="small"
                    >
                      {{ student.has_sf9 ? "Generated" : "Not Generated" }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="tonal"
                      class="mr-2"
                    >
                      {{ student.has_sf9 ? "View" : "Generate" }}
                    </v-btn>
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
    has_sf9: boolean;
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

  // Get section_subject_ids for this section
  const { data: sectionSubjects } = await supabase
    .from("section_subjects")
    .select("section_subject_id")
    .eq("section_id", selectedSection.value);

  if (!sectionSubjects?.length) return;

  const ssIds = sectionSubjects.map((s) => s.section_subject_id);

  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      student_id,
      students(student_id, lrn, first_name, last_name)
    `
    )
    .in("section_subject_id", ssIds);

  const seen = new Set();
  const uniqueStudents = (data || [])
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
      has_sf9: false,
    }));

  // Check which students have SF9
  for (const student of uniqueStudents) {
    const { data: doc } = await supabase
      .from("documents")
      .select("document_id")
      .eq("student_id", student.student_id)
      .eq("document_type", "SF9")
      .eq("is_active", true)
      .limit(1);

    student.has_sf9 = (doc?.length || 0) > 0;
  }

  students.value = uniqueStudents;
}
</script>
