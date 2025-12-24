/**
 * Classes/Sections Composable
 * Handles class and section management for admin and teachers
 *
 * PHASE 13: Admin Module - Class Management
 * - Create, update, delete classes/sections
 * - Assign homeroom teachers
 * - Track student capacity
 * - Grade level, track, strand assignments
 */

import type { Database } from "@/types/supabase";

import { ref } from "vue";

import { supabase } from "@/services/supabase";

type Class = Database["public"]["Tables"]["classes"]["Row"];
type ClassInsert = Database["public"]["Tables"]["classes"]["Insert"];
type ClassUpdate = Database["public"]["Tables"]["classes"]["Update"];

export interface ClassWithDetails extends Class {
  teacher?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  student_count?: number;
  school_year?: {
    year_code: string;
  } | null;
}

export function useClasses() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch all classes with teacher and student count
   */
  async function fetchClasses(
    schoolYearId?: string
  ): Promise<ClassWithDetails[]> {
    loading.value = true;
    error.value = null;

    try {
      let query = supabase
        .from("classes")
        .select(
          `
          *,
          teacher:teacher_id (
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              email
            )
          ),
          school_year:school_year_id (
            year_code
          )
        `
        )
        .order("grade_level", { ascending: true })
        .order("section_name", { ascending: true });

      if (schoolYearId) {
        query = query.eq("school_year_id", schoolYearId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        error.value = "Failed to fetch classes";
        console.error("[Classes] Fetch error:", fetchError);
        return [];
      }

      // Get student counts for each class
      const classesWithCounts = await Promise.all(
        (data || []).map(async (classItem: any) => {
          const { count } = await supabase
            .from("student_sections")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classItem.id)
            .eq("is_active", true);

          // Flatten teacher data structure
          const teacherData = classItem.teacher?.profiles
            ? {
                first_name: classItem.teacher.profiles.first_name,
                last_name: classItem.teacher.profiles.last_name,
                email: classItem.teacher.profiles.email,
              }
            : null;

          return {
            ...classItem,
            teacher: teacherData,
            student_count: count || 0,
          };
        })
      );

      return classesWithCounts as ClassWithDetails[];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Classes] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch single class with details
   */
  async function fetchClassById(
    classId: string
  ): Promise<ClassWithDetails | null> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("classes")
        .select(
          `
          *,
          teacher:teacher_id (
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              email
            )
          ),
          school_year:school_year_id (
            year_code
          )
        `
        )
        .eq("id", classId)
        .single();

      if (fetchError) {
        error.value = "Failed to fetch class";
        console.error("[Classes] Fetch class error:", fetchError);
        return null;
      }

      // Get student count
      const { count } = await supabase
        .from("student_sections")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId)
        .eq("is_active", true);

      // Flatten teacher data structure
      const teacherData = data.teacher?.profiles
        ? {
            first_name: data.teacher.profiles.first_name,
            last_name: data.teacher.profiles.last_name,
            email: data.teacher.profiles.email,
          }
        : null;

      return {
        ...data,
        teacher: teacherData,
        student_count: count || 0,
      } as ClassWithDetails;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Classes] Exception:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create new class/section
   */
  async function createClass(
    classData: ClassInsert,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: insertError } = await supabase
        .from("classes")
        .insert(classData);

      if (insertError) {
        error.value = "Failed to create class";
        console.error("[Classes] Create error:", insertError);
        return false;
      }

      // Log to audit
      await supabase.from("audit_logs").insert({
        user_id: adminId,
        action: "class_created",
        entity_type: "Class",
        entity_id: classData.section_name || "New Class",
        metadata: { description: `Created class ${classData.section_name}` },
        new_values: classData,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Classes] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update existing class/section
   */
  async function updateClass(
    classId: string,
    updates: ClassUpdate,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("classes")
        .update(updates)
        .eq("id", classId);

      if (updateError) {
        error.value = "Failed to update class";
        console.error("[Classes] Update error:", updateError);
        return false;
      }

      // Log to audit
      await supabase.from("audit_logs").insert({
        user_id: adminId,
        action: "class_updated",
        entity_type: "Class",
        entity_id: classId,
        metadata: {
          description: `Updated class ${updates.section_name || classId}`,
        },
        new_values: updates,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Classes] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete class/section
   */
  async function deleteClass(
    classId: string,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Check if class has students
      const { count } = await supabase
        .from("student_sections")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId);

      if (count && count > 0) {
        error.value = `Cannot delete class with ${count} enrolled students`;
        return false;
      }

      const { error: deleteError } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (deleteError) {
        error.value = "Failed to delete class";
        console.error("[Classes] Delete error:", deleteError);
        return false;
      }

      // Log to audit
      await supabase.from("audit_logs").insert({
        user_id: adminId,
        action: "class_deleted",
        entity_type: "Class",
        entity_id: classId,
        metadata: { description: "Deleted class" },
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Classes] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Assign homeroom teacher to class
   */
  async function assignTeacher(
    classId: string,
    teacherId: string,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("classes")
        .update({ teacher_id: teacherId })
        .eq("id", classId);

      if (updateError) {
        error.value = "Failed to assign teacher";
        console.error("[Classes] Assign teacher error:", updateError);
        return false;
      }

      // Log to audit
      await supabase.from("audit_logs").insert({
        user_id: adminId,
        action: "teacher_assigned_to_class",
        entity_type: "Class",
        entity_id: classId,
        metadata: { description: `Assigned teacher ${teacherId} to class` },
        new_values: { teacher_id: teacherId },
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Classes] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get students enrolled in a class
   */
  async function getClassStudents(classId: string): Promise<any[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("student_sections")
        .select(
          `
          *,
          student:student_id (
            id,
            lrn,
            student_number,
            grade_level,
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              middle_name,
              email
            )
          )
        `
        )
        .eq("class_id", classId)
        .eq("is_active", true)
        .order("student(lrn)", { ascending: true });

      if (fetchError) {
        error.value = "Failed to fetch class students";
        console.error("[Classes] Fetch students error:", fetchError);
        return [];
      }

      // Flatten student data structure
      const studentsWithProfiles = (data || []).map((enrollment: any) => ({
        ...enrollment,
        student: enrollment.student?.profiles
          ? {
              id: enrollment.student.id,
              lrn: enrollment.student.lrn,
              student_number: enrollment.student.student_number,
              grade_level: enrollment.student.grade_level,
              first_name: enrollment.student.profiles.first_name,
              last_name: enrollment.student.profiles.last_name,
              middle_name: enrollment.student.profiles.middle_name,
              email: enrollment.student.profiles.email,
            }
          : enrollment.student,
      }));

      return studentsWithProfiles;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Classes] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    fetchClasses,
    fetchClassById,
    createClass,
    updateClass,
    deleteClass,
    assignTeacher,
    getClassStudents,
  };
}
