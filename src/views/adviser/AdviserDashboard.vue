<template>
  <v-container fluid class="pa-6">
    <!-- Access Check -->
    <v-row v-if="accessDenied">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" class="text-center">
          <v-icon size="48" class="mb-2">mdi-shield-alert</v-icon>
          <div class="text-h6">Access Denied</div>
          <div class="text-body-2">
            You do not have permission to access this page.
          </div>
          <v-btn color="primary" class="mt-4" to="/">Go Home</v-btn>
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 font-weight-bold mb-2">Adviser Dashboard</h1>
          <p class="text-body-1 text-grey-darken-1">
            Manage your assigned classes, encode grades, and generate documents.
          </p>
        </v-col>
      </v-row>

      <!-- Stats Cards -->
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

      <!-- Assigned Classes & Quick Actions -->
      <v-row class="mt-4">
        <v-col cols="12" md="8">
          <v-card elevation="4">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-bold"
                >My Assigned Classes</span
              >
              <v-chip size="small" color="primary" variant="tonal">
                {{ assignedClasses.length }} classes
              </v-chip>
            </v-card-title>
            <v-card-text v-if="loading" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </v-card-text>
            <v-card-text v-else-if="assignedClasses.length" class="pa-0">
              <v-row class="pa-4" dense>
                <v-col
                  v-for="cls in assignedClasses"
                  :key="cls.section_subject_id"
                  cols="12"
                  sm="6"
                >
                  <v-card variant="outlined" class="pa-3">
                    <div class="d-flex align-center mb-2">
                      <v-avatar color="primary" size="36" variant="tonal">
                        <v-icon size="20">mdi-google-classroom</v-icon>
                      </v-avatar>
                      <div class="ml-3">
                        <div class="font-weight-bold">
                          {{ cls.section_name }}
                        </div>
                        <div class="text-caption text-grey">
                          {{ cls.subject_name }}
                        </div>
                      </div>
                    </div>
                    <div class="text-caption text-grey mb-2">
                      <v-icon size="14" class="mr-1">mdi-calendar</v-icon>
                      {{ cls.semester_name }} • {{ cls.school_year }}
                    </div>
                    <div class="text-caption mb-3">
                      <v-icon size="14" class="mr-1">mdi-account-group</v-icon>
                      {{ cls.student_count }} students enrolled
                    </div>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="tonal"
                      block
                      :to="`/adviser/grades?ss=${cls.section_subject_id}`"
                    >
                      <v-icon start size="16">mdi-clipboard-edit</v-icon>
                      Encode Grades
                    </v-btn>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-text v-else class="text-center py-8 text-grey">
              <v-icon size="48" color="grey" class="mb-2"
                >mdi-folder-open-outline</v-icon
              >
              <div class="text-body-1">No classes assigned yet.</div>
              <div class="text-caption">
                Contact your administrator to get assigned to sections.
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card elevation="4" class="mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold"
              >Quick Actions</v-card-title
            >
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
                Document Center
              </v-btn>
              <v-btn
                block
                variant="outlined"
                prepend-icon="mdi-account-school"
                to="/adviser/students"
              >
                View Students
              </v-btn>
              <v-btn
                block
                variant="outlined"
                prepend-icon="mdi-account-plus"
                to="/adviser/enroll"
              >
                Enroll Students
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card elevation="4">
            <v-card-title class="text-subtitle-1 font-weight-bold"
              >My Advised Sections</v-card-title
            >
            <v-card-text v-if="advisedSections.length">
              <v-list density="compact">
                <v-list-item
                  v-for="section in advisedSections"
                  :key="section.section_id"
                >
                  <template #prepend>
                    <v-icon color="success">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>{{ section.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ section.student_count }} students
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-text v-else class="text-center py-4 text-grey">
              No sections advised.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const authStore = useAuthStore();

interface AssignedClass {
  section_subject_id: number;
  section_name: string;
  subject_name: string;
  semester_name: string;
  school_year: string;
  student_count: number;
}

interface AdvisedSection {
  section_id: number;
  name: string;
  student_count: number;
}

const loading = ref(false);
const accessDenied = computed(
  () => !["teacher", "adviser"].includes(authStore.role || "")
);

const assignedClasses = ref<AssignedClass[]>([]);
const advisedSections = ref<AdvisedSection[]>([]);

const stats = ref([
  {
    title: "Assigned Classes",
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
  {
    title: "Documents Generated",
    value: "0",
    icon: "mdi-file-document",
    color: "info",
  },
]);

async function loadData() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  loading.value = true;

  try {
    // Get teacher_id
    const { data: teacher } = await supabase
      .from("teachers")
      .select("teacher_id")
      .eq("user_id", userId)
      .single();

    if (!teacher) {
      loading.value = false;
      return;
    }

    const teacherId = teacher.teacher_id;

    // Get assigned classes (section_subjects where teacher is assigned)
    const { data: classData } = await supabase
      .from("section_subjects")
      .select(
        `
        section_subject_id,
        sections(section_id, name, school_years(year_label)),
        subjects(subject_name),
        semesters(name)
      `
      )
      .eq("teacher_id", teacherId);

    if (classData) {
      // Get student counts for each section_subject
      const classesWithCounts = await Promise.all(
        classData.map(async (cls: any) => {
          const { count } = await supabase
            .from("enrollments")
            .select("enrollment_id", { count: "exact", head: true })
            .eq("section_subject_id", cls.section_subject_id);

          return {
            section_subject_id: cls.section_subject_id,
            section_name: cls.sections?.name || "Unknown",
            subject_name: cls.subjects?.subject_name || "Unknown",
            semester_name: cls.semesters?.name || "Unknown",
            school_year: cls.sections?.school_years?.year_label || "Unknown",
            student_count: count || 0,
          };
        })
      );

      assignedClasses.value = classesWithCounts;
    }

    // Get advised sections
    const { data: sectionData } = await supabase
      .from("sections")
      .select("section_id, name")
      .eq("adviser_teacher_id", teacherId);

    if (sectionData) {
      const sectionsWithCounts = await Promise.all(
        sectionData.map(async (section: any) => {
          // Count unique students in section via section_subjects
          const { data: ssIds } = await supabase
            .from("section_subjects")
            .select("section_subject_id")
            .eq("section_id", section.section_id);

          let studentCount = 0;
          if (ssIds && ssIds.length > 0) {
            const ids = ssIds.map((s) => s.section_subject_id);
            const { count } = await supabase
              .from("enrollments")
              .select("student_id", { count: "exact", head: true })
              .in("section_subject_id", ids);
            studentCount = count || 0;
          }

          return {
            section_id: section.section_id,
            name: section.name,
            student_count: studentCount,
          };
        })
      );

      advisedSections.value = sectionsWithCounts;
    }

    // Calculate total students across all assigned classes
    const totalStudents = assignedClasses.value.reduce(
      (sum, cls) => sum + cls.student_count,
      0
    );

    // Count documents generated by this teacher (approximate)
    const { count: docCount } = await supabase
      .from("documents")
      .select("document_id", { count: "exact", head: true })
      .eq("generated_by", userId);

    // Update stats
    if (stats.value[0])
      stats.value[0].value = String(assignedClasses.value.length);
    if (stats.value[1]) stats.value[1].value = String(totalStudents);
    if (stats.value[2]) stats.value[2].value = "0"; // TODO: Calculate pending grades
    if (stats.value[3]) stats.value[3].value = String(docCount || 0);
  } catch (error) {
    console.error("Error loading adviser data:", error);
  }

  loading.value = false;
}

onMounted(() => {
  if (accessDenied.value) {
    setTimeout(() => router.push("/"), 2000);
  } else {
    loadData();
  }
});
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
