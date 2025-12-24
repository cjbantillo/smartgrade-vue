import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

export interface TeacherClass {
  id: string;
  teacher_id: string;
  subject_id: string;
  section: string;
  school_year_id: string;
  grading_period: number;
  created_at: string;
  updated_at: string;
  // Joined data
  subject_name?: string;
  subject_code?: string;
  school_year?: string;
  student_count?: number;
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  // Joined student data
  lrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  track?: string;
  strand?: string;
  grade_level: number;
}

export interface StudentSearchResult {
  id: string;
  user_id: string;
  lrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  track?: string;
  strand?: string;
  grade_level: number;
  email?: string;
}

export function useTeacher() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch all classes for the current teacher
   */
  async function fetchTeacherClasses(): Promise<TeacherClass[]> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Teacher profile not found");
      }

      const { data, error: fetchError } = await supabase
        .from("classes")
        .select(
          `
          id,
          section_name,
          grade_level,
          track,
          strand,
          room,
          capacity,
          semester,
          school_year_id,
          teacher_id,
          created_at,
          updated_at
        `
        )
        .eq("teacher_id", authStore.profile.user_id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get student counts for each class
      const classIds = data?.map((c) => c.id) || [];
      let studentCounts: Record<string, number> = {};

      if (classIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("student_sections")
          .select("class_id")
          .in("class_id", classIds)
          .eq("is_active", true);

        studentCounts =
          enrollments?.reduce((acc, e) => {
            acc[e.class_id] = (acc[e.class_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};
      }

      return (data || []).map((c) => ({
        id: c.id,
        section_name: c.section_name,
        grade_level: c.grade_level,
        track: c.track,
        strand: c.strand,
        room: c.room,
        capacity: c.capacity,
        semester: c.semester,
        school_year_id: c.school_year_id,
        teacher_id: c.teacher_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        student_count: studentCounts[c.id] || 0,
      }));
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to fetch classes";
      console.error("Error fetching teacher classes:", error_);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new class
   */
  async function createClass(data: {
    subject_id: string;
    section: string;
    school_year_id: string;
    grading_period: number;
  }): Promise<TeacherClass | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Teacher profile not found");
      }

      // Get teacher record
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", authStore.profile.user_id)
        .single();

      if (!teacherData) {
        throw new Error("Teacher record not found");
      }

      // Check for duplicate class
      const { data: existing } = await supabase
        .from("teacher_classes")
        .select("id")
        .eq("teacher_id", teacherData.id)
        .eq("subject_id", data.subject_id)
        .eq("section", data.section)
        .eq("school_year_id", data.school_year_id)
        .single();

      if (existing) {
        throw new Error(
          "You already have a class with this subject and section"
        );
      }

      const { data: newClass, error: insertError } = await supabase
        .from("teacher_classes")
        .insert({
          teacher_id: teacherData.id,
          subject_id: data.subject_id,
          section: data.section,
          school_year_id: data.school_year_id,
          created_by: authStore.profile.user_id,
        })
        .select(
          `
          id,
          teacher_id,
          subject_id,
          section,
          school_year_id,
          created_at,
          updated_at,
          subjects:subject_id (
            subject_name,
            subject_code
          ),
          school_years:school_year_id (
            year_code
          )
        `
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.user?.id,
        action: "class_created",
        entity_type: "teacher_class",
        entity_id: newClass.id,
        metadata: {
          description: `Created class: ${
            (newClass.subjects as any)?.subject_name
          } - ${newClass.section}`,
        },
        new_values: {
          subject: (newClass.subjects as any)?.subject_name,
          section: newClass.section,
          school_year: (newClass.school_years as any)?.year_code,
        },
      });

      return {
        id: newClass.id,
        teacher_id: newClass.teacher_id,
        subject_id: newClass.subject_id,
        section: newClass.section,
        school_year_id: newClass.school_year_id,
        grading_period: data.grading_period,
        created_at: newClass.created_at,
        updated_at: newClass.updated_at,
        subject_name: (newClass.subjects as any)?.subject_name,
        subject_code: (newClass.subjects as any)?.subject_code,
        school_year: (newClass.school_years as any)?.year_code,
        student_count: 0,
      };
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to create class";
      console.error("Error creating class:", error_);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch students enrolled in a specific class
   */
  async function fetchClassStudents(classId: string): Promise<ClassStudent[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("class_enrollments")
        .select(
          `
          id,
          class_id,
          student_id,
          enrolled_at,
          students:student_id (
            id,
            lrn,
            first_name,
            middle_name,
            last_name,
            track,
            strand,
            grade_level
          )
        `
        )
        .eq("class_id", classId)
        .order("enrolled_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return (data || []).map((e) => ({
        id: e.id,
        class_id: e.class_id,
        student_id: e.student_id,
        enrolled_at: e.enrolled_at,
        lrn: (e.students as any)?.lrn || "",
        first_name: (e.students as any)?.first_name || "",
        middle_name: (e.students as any)?.middle_name,
        last_name: (e.students as any)?.last_name || "",
        track: (e.students as any)?.track,
        strand: e.students?.strand,
        grade_level: e.students?.grade_level || 0,
      }));
    } catch (error_) {
      error.value =
        error_ instanceof Error
          ? error_.message
          : "Failed to fetch class students";
      console.error("Error fetching class students:", error_);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Search for students by LRN, name, or ID
   */
  async function searchStudents(query: string): Promise<StudentSearchResult[]> {
    loading.value = true;
    error.value = null;

    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = query.trim();

      // Search by LRN, first name, or last name
      const { data, error: searchError } = await supabase
        .from("students")
        .select(
          `
          id,
          user_id,
          lrn,
          first_name,
          middle_name,
          last_name,
          track,
          strand,
          grade_level,
          profiles:user_id (
            email
          )
        `
        )
        .or(
          `lrn.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
        )
        .limit(20);

      if (searchError) {
        throw searchError;
      }

      return (data || []).map((s) => ({
        id: s.id,
        user_id: s.user_id,
        lrn: s.lrn,
        first_name: s.first_name,
        middle_name: s.middle_name,
        last_name: s.last_name,
        track: s.track,
        strand: s.strand,
        grade_level: s.grade_level,
        email: (s.profiles as any)?.email,
      }));
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to search students";
      console.error("Error searching students:", error_);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Enroll a student in a class
   */
  async function enrollStudent(
    classId: string,
    studentId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Check if student is already enrolled
      const { data: existing } = await supabase
        .from("class_enrollments")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", studentId)
        .single();

      if (existing) {
        throw new Error("Student is already enrolled in this class");
      }

      const { error: insertError } = await supabase
        .from("class_enrollments")
        .insert({
          class_id: classId,
          student_id: studentId,
        });

      if (insertError) {
        throw insertError;
      }

      // Get student details for audit log
      const { data: student } = await supabase
        .from("students")
        .select("lrn, first_name, last_name")
        .eq("id", studentId)
        .single();

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.user?.id,
        action: "student_enrolled",
        entity_type: "class_enrollment",
        entity_id: classId,
        new_values: {
          student_lrn: student?.lrn,
          student_name: `${student?.first_name} ${student?.last_name}`,
        },
      });

      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to enroll student";
      console.error("Error enrolling student:", error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Remove a student from a class
   */
  async function unenrollStudent(enrollmentId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Get enrollment details for audit log
      const { data: enrollment } = await supabase
        .from("class_enrollments")
        .select(
          `
          class_id,
          students:student_id (
            lrn,
            first_name,
            last_name
          )
        `
        )
        .eq("id", enrollmentId)
        .single();

      const { error: deleteError } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.user?.id,
        action: "student_unenrolled",
        entity_type: "class_enrollment",
        entity_id: enrollment?.class_id,
        old_values: {
          student_lrn: (enrollment?.students as any)?.lrn,
          student_name: `${(enrollment?.students as any)?.first_name} ${
            (enrollment?.students as any)?.last_name
          }`,
        },
      });

      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to unenroll student";
      console.error("Error unenrolling student:", error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch all subjects for dropdowns
   */
  async function fetchSubjects() {
    const { data, error: fetchError } = await supabase
      .from("subjects")
      .select("id, subject_code, subject_name, track, strand")
      .order("subject_name");

    if (fetchError) {
      console.error("Error fetching subjects:", fetchError);
      return [];
    }

    return data || [];
  }

  /**
   * Fetch all school years for dropdowns
   */
  async function fetchSchoolYears() {
    const { data, error: fetchError } = await supabase
      .from("school_years")
      .select("id, year_code, is_active")
      .order("year_code", { ascending: false });

    if (fetchError) {
      console.error("Error fetching school years:", fetchError);
      return [];
    }

    return data || [];
  }

  return {
    loading,
    error,
    fetchTeacherClasses,
    createClass,
    fetchClassStudents,
    searchStudents,
    enrollStudent,
    unenrollStudent,
    fetchSubjects,
    fetchSchoolYears,
  };
}
