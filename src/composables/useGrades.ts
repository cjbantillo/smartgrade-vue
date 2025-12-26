import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

export interface GradeEntry {
  id?: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  school_year_id: string;
  grading_period_id: string;
  written_work_score: number | null;
  written_work_total: number | null;
  performance_task_score: number | null;
  performance_task_total: number | null;
  quarterly_assessment_score: number | null;
  quarterly_assessment_total: number | null;
  quarterly_grade: number | null;
  remarks: string | null;
  // Joined student data
  student_lrn?: string;
  student_first_name?: string;
  student_middle_name?: string;
  student_last_name?: string;
}

export interface GradingPeriod {
  id: string;
  period_number: number;
  school_year_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface FinalizationStatus {
  id?: string;
  student_id: string;
  school_year_id: string;
  semester: "1" | "2";
  is_finalized: boolean;
  general_average: number | null;
  finalized_by: string | null;
  finalized_at: string | null;
  unlock_count: number;
}

export interface SystemSettings {
  written_work_percentage: number;
  performance_task_percentage: number;
  quarterly_assessment_percentage: number;
  passing_grade: number;
}

export function useGrades() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch grades for a specific class
   */
  async function fetchClassGrades(classId: string): Promise<GradeEntry[]> {
    loading.value = true;
    error.value = null;

    try {
      // First get class details
      const { data: classData } = await supabase
        .from("class_assignments")
        .select("subject_id, school_year_id, grading_period")
        .eq("id", classId)
        .single();

      if (!classData) {
        throw new Error("Class not found");
      }

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("student_id")
        .eq("class_id", classId);

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const studentIds = enrollments.map((e) => e.student_id);

      // Get grading period ID
      const { data: gradingPeriod } = await supabase
        .from("grading_periods")
        .select("id")
        .eq("school_year_id", classData.school_year_id)
        .eq("period_number", classData.grading_period)
        .single();

      if (!gradingPeriod) {
        throw new Error("Grading period not found");
      }

      // Fetch existing grades or create skeleton entries
      const { data: existingGrades } = await supabase
        .from("grades")
        .select(
          `
          id,
          student_id,
          subject_id,
          teacher_id,
          school_year_id,
          grading_period_id,
          written_work_score,
          written_work_total,
          performance_task_score,
          performance_task_total,
          quarterly_assessment_score,
          quarterly_assessment_total,
          quarterly_grade,
          remarks,
          students:student_id (
            lrn,
            first_name,
            middle_name,
            last_name
          )
        `
        )
        .eq("subject_id", classData.subject_id)
        .eq("grading_period_id", gradingPeriod.id)
        .in("student_id", studentIds);

      // Get student details for students without grades
      const existingStudentIds = existingGrades?.map((g) => g.student_id) || [];
      const missingStudentIds = studentIds.filter(
        (id) => !existingStudentIds.includes(id)
      );

      const { data: missingStudents } = await supabase
        .from("students")
        .select("id, lrn, first_name, middle_name, last_name")
        .in("id", missingStudentIds);

      // Combine existing and new entries
      const allGrades: GradeEntry[] = [
        ...(existingGrades || []).map((g) => ({
          id: g.id,
          student_id: g.student_id,
          subject_id: g.subject_id,
          teacher_id: g.teacher_id,
          school_year_id: g.school_year_id,
          grading_period_id: g.grading_period_id,
          written_work_score: g.written_work_score,
          written_work_total: g.written_work_total,
          performance_task_score: g.performance_task_score,
          performance_task_total: g.performance_task_total,
          quarterly_assessment_score: g.quarterly_assessment_score,
          quarterly_assessment_total: g.quarterly_assessment_total,
          quarterly_grade: g.quarterly_grade,
          remarks: g.remarks,
          student_lrn: g.students?.lrn,
          student_first_name: g.students?.first_name,
          student_middle_name: g.students?.middle_name,
          student_last_name: g.students?.last_name,
        })),
        ...(missingStudents || []).map((s) => ({
          student_id: s.id,
          subject_id: classData.subject_id,
          teacher_id: authStore.profile!.id,
          school_year_id: classData.school_year_id,
          grading_period_id: gradingPeriod.id,
          written_work_score: null,
          written_work_total: null,
          performance_task_score: null,
          performance_task_total: null,
          quarterly_assessment_score: null,
          quarterly_assessment_total: null,
          quarterly_grade: null,
          remarks: null,
          student_lrn: s.lrn,
          student_first_name: s.first_name,
          student_middle_name: s.middle_name,
          student_last_name: s.last_name,
        })),
      ];

      // Sort by last name
      return allGrades.sort((a, b) =>
        (a.student_last_name || "").localeCompare(b.student_last_name || "")
      );
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to fetch grades";
      console.error("Error fetching class grades:", error_);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Save or update a grade entry
   */
  async function saveGrade(grade: GradeEntry): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Check if grades are finalized
      const isLocked = await checkGradeFinalization(
        grade.student_id,
        grade.school_year_id,
        "1" // TODO: Determine semester from grading period
      );

      if (isLocked) {
        throw new Error(
          "Cannot modify finalized grades. Request unlock from admin."
        );
      }

      const gradeData = {
        student_id: grade.student_id,
        subject_id: grade.subject_id,
        teacher_id: grade.teacher_id,
        school_year_id: grade.school_year_id,
        grading_period_id: grade.grading_period_id,
        written_work_score: grade.written_work_score,
        written_work_total: grade.written_work_total,
        performance_task_score: grade.performance_task_score,
        performance_task_total: grade.performance_task_total,
        quarterly_assessment_score: grade.quarterly_assessment_score,
        quarterly_assessment_total: grade.quarterly_assessment_total,
        quarterly_grade: grade.quarterly_grade,
        remarks: grade.remarks,
        entered_by: authStore.user!.id,
      };

      if (grade.id) {
        // Update existing grade
        const { error: updateError } = await supabase
          .from("grades")
          .update(gradeData)
          .eq("id", grade.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Insert new grade
        const { error: insertError } = await supabase
          .from("grades")
          .insert(gradeData);

        if (insertError) {
          throw insertError;
        }
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.user!.id,
        action: grade.id ? "grade_updated" : "grade_entered",
        entity_type: "grade",
        entity_id: grade.id || grade.student_id,
        new_values: {
          student: `${grade.student_first_name} ${grade.student_last_name}`,
          quarterly_grade: grade.quarterly_grade,
        },
      });

      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to save grade";
      console.error("Error saving grade:", error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Compute quarterly grade using DepEd formula
   * WW: 30%, PT: 50%, QA: 20%
   */
  function computeQuarterlyGrade(
    wwScore: number | null,
    wwTotal: number | null,
    ptScore: number | null,
    ptTotal: number | null,
    qaScore: number | null,
    qaTotal: number | null,
    settings?: SystemSettings
  ): number | null {
    // Use default DepEd percentages or custom settings
    const wwPercent = settings?.written_work_percentage || 30;
    const ptPercent = settings?.performance_task_percentage || 50;
    const qaPercent = settings?.quarterly_assessment_percentage || 20;

    // All components must be present
    if (
      wwScore === null ||
      wwTotal === null ||
      ptScore === null ||
      ptTotal === null ||
      qaScore === null ||
      qaTotal === null ||
      wwTotal === 0 ||
      ptTotal === 0 ||
      qaTotal === 0
    ) {
      return null;
    }

    // Convert raw scores to percentages
    const wwPercentage = (wwScore / wwTotal) * 100;
    const ptPercentage = (ptScore / ptTotal) * 100;
    const qaPercentage = (qaScore / qaTotal) * 100;

    // Apply DepEd weighted formula
    const quarterlyGrade =
      wwPercentage * (wwPercent / 100) +
      ptPercentage * (ptPercent / 100) +
      qaPercentage * (qaPercent / 100);

    // Round to 2 decimal places
    return Math.round(quarterlyGrade * 100) / 100;
  }

  /**
   * Check if grades are finalized for a student
   */
  async function checkGradeFinalization(
    studentId: string,
    schoolYearId: string,
    semester: "1" | "2"
  ): Promise<boolean> {
    const { data } = await supabase
      .from("grade_finalization_status")
      .select("is_finalized")
      .eq("student_id", studentId)
      .eq("school_year_id", schoolYearId)
      .eq("semester", semester)
      .single();

    return data?.is_finalized || false;
  }

  /**
   * Finalize grades for all students in a class
   */
  async function finalizeClassGrades(
    classId: string,
    studentGrades: GradeEntry[]
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Validate all students have complete grades
      const incompleteStudents = studentGrades.filter(
        (g) => g.quarterly_grade === null
      );

      if (incompleteStudents.length > 0) {
        throw new Error(
          `Cannot finalize: ${incompleteStudents.length} student(s) have incomplete grades`
        );
      }

      // Get class details
      const { data: classData } = await supabase
        .from("class_assignments")
        .select("school_year_id")
        .eq("id", classId)
        .single();

      if (!classData) {
        throw new Error("Class not found");
      }

      // Create or update finalization status for each student
      for (const grade of studentGrades) {
        const { error: upsertError } = await supabase
          .from("grade_finalization_status")
          .upsert(
            {
              student_id: grade.student_id,
              school_year_id: classData.school_year_id,
              semester: "1", // TODO: Determine from grading period
              is_finalized: true,
              finalized_by: authStore.user!.id,
              finalized_at: new Date().toISOString(),
            },
            {
              onConflict: "student_id,school_year_id,semester",
            }
          );

        if (upsertError) {
          throw upsertError;
        }
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.user!.id,
        action: "grades_finalized",
        entity_type: "class_assignment",
        entity_id: classId,
        new_values: {
          student_count: studentGrades.length,
        },
      });

      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to finalize grades";
      console.error("Error finalizing grades:", error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get finalization status for multiple students
   */
  async function fetchFinalizationStatuses(
    studentIds: string[],
    schoolYearId: string,
    semester: "1" | "2"
  ): Promise<Map<string, FinalizationStatus>> {
    const { data } = await supabase
      .from("grade_finalization_status")
      .select("*")
      .in("student_id", studentIds)
      .eq("school_year_id", schoolYearId)
      .eq("semester", semester);

    const statusMap = new Map<string, FinalizationStatus>();

    if (data) {
      for (const status of data) {
        statusMap.set(status.student_id, status);
      }
    }

    return statusMap;
  }

  /**
   * DELETE: Remove a grade entry
   */
  async function deleteGrade(gradeId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Fetch grade details first
      const { data: grade } = await supabase
        .from("grades")
        .select("student_id, school_year_id")
        .eq("id", gradeId)
        .single();

      if (!grade) {
        throw new Error("Grade not found");
      }

      // Check if grades are finalized
      const isLocked = await checkGradeFinalization(
        grade.student_id,
        grade.school_year_id,
        "1"
      );

      if (isLocked) {
        throw new Error(
          "Cannot delete finalized grades. Request unlock from admin."
        );
      }

      const { error: deleteError } = await supabase
        .from("grades")
        .delete()
        .eq("id", gradeId);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile?.user_id,
        action: "grade_deleted",
        table_name: "grades",
        record_id: gradeId,
      });

      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to delete grade";
      console.error("Error deleting grade:", error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * REQUEST: Create a grade unlock request
   */
  async function requestGradeUnlock(
    studentId: string,
    schoolYearId: string,
    semester: "1" | "2",
    reason: string
  ): Promise<string | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Teacher profile not found");
      }

      const { data, error: insertError } = await supabase
        .from("grade_unlock_requests")
        .insert({
          student_id: studentId,
          school_year_id: schoolYearId,
          semester,
          reason,
          status: "pending",
          requested_by_teacher: authStore.profile.user_id,
          requested_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "grade_unlock_requested",
        table_name: "grade_unlock_requests",
        record_id: data.id,
        new_values: { reason },
      });

      return data.id;
    } catch (error_) {
      error.value =
        error_ instanceof Error
          ? error_.message
          : "Failed to request grade unlock";
      console.error("Error requesting grade unlock:", error_);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * COMPUTE: Calculate GPA from final grades
   */
  async function computeStudentGPA(
    studentId: string,
    schoolYearId: string
  ): Promise<number | null> {
    loading.value = true;
    error.value = null;

    try {
      // Fetch all final grades for the student in this school year
      const { data: grades } = await supabase
        .from("grades")
        .select("final_grade, subjects:subject_id (credit_units)")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .not("final_grade", "is", null);

      if (!grades || grades.length === 0) {
        return null;
      }

      // Calculate weighted GPA
      let totalWeightedGrade = 0;
      let totalUnits = 0;

      for (const grade of grades) {
        const units = (grade.subjects as any)?.credit_units || 1;
        totalWeightedGrade += (grade.final_grade || 0) * units;
        totalUnits += units;
      }

      if (totalUnits === 0) {
        return null;
      }

      const gpa = totalWeightedGrade / totalUnits;
      return Math.round(gpa * 100) / 100;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to compute GPA";
      console.error("Error computing GPA:", error_);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Finalize grades with validation
   */
  async function finalizeGrades(
    studentId: string,
    schoolYearId: string,
    semester: "1" | "2"
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Teacher profile not found");
      }

      // Verify all final grades are entered
      const { data: grades } = await supabase
        .from("grades")
        .select("id, final_grade")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId);

      const incompleteGrades =
        grades?.filter((g) => g.final_grade === null) || [];

      if (incompleteGrades.length > 0) {
        throw new Error(
          `Cannot finalize: ${incompleteGrades.length} subject(s) missing final grades`
        );
      }

      // Compute GPA
      const gpa = await computeStudentGPA(studentId, schoolYearId);

      if (gpa === null) {
        throw new Error("Cannot compute GPA with current grades");
      }

      // Create finalization record
      const { error: finalizeError } = await supabase
        .from("grade_finalization_status")
        .upsert(
          {
            student_id: studentId,
            school_year_id: schoolYearId,
            semester,
            is_finalized: true,
            general_average: gpa,
            finalized_by: authStore.profile.user_id,
            finalized_at: new Date().toISOString(),
            unlock_count: 0,
          },
          {
            onConflict: "student_id,school_year_id,semester",
          }
        );

      if (finalizeError) {
        throw finalizeError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "grades_finalized",
        table_name: "grade_finalization_status",
        record_id: studentId,
        new_values: { gpa, semester },
      });

      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to finalize grades";
      console.error("Error finalizing grades:", error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * FETCH: Get student's current GPA
   */
  async function fetchStudentGPA(
    studentId: string,
    schoolYearId: string,
    semester: "1" | "2"
  ): Promise<number | null> {
    loading.value = true;
    error.value = null;

    try {
      const { data } = await supabase
        .from("grade_finalization_status")
        .select("general_average")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .eq("semester", semester)
        .eq("is_finalized", true)
        .single();

      return data?.general_average || null;
    } catch (error_) {
      // Not found is expected in some cases
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Edit component scores with proper validation
   */
  async function updateGradeComponent(
    gradeId: string,
    component: "written_work" | "performance_task" | "quarterly_assessment",
    score: number,
    total: number
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (score < 0 || total <= 0 || score > total) {
        throw new Error("Invalid score values");
      }

      const updateData: Record<string, any> = {};
      updateData[`${component}_score`] = score;
      updateData[`${component}_total`] = total;

      const { error: updateError } = await supabase
        .from("grades")
        .update(updateData)
        .eq("id", gradeId);

      if (updateError) {
        throw updateError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile?.user_id,
        action: `grade_component_updated`,
        table_name: "grades",
        record_id: gradeId,
        new_values: { [component]: { score, total } },
      });

      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : "Failed to update grade";
      console.error("Error updating grade component:", error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get system grading settings
   */
  async function fetchSystemSettings(): Promise<SystemSettings> {
    const { data } = await supabase
      .from("system_settings")
      .select("*")
      .single();

    return (
      data || {
        written_work_percentage: 30,
        performance_task_percentage: 50,
        quarterly_assessment_percentage: 20,
        passing_grade: 75,
      }
    );
  }

  return {
    loading,
    error,
    fetchClassGrades,
    saveGrade,
    deleteGrade,
    computeQuarterlyGrade,
    checkGradeFinalization,
    finalizeClassGrades,
    fetchFinalizationStatuses,
    requestGradeUnlock,
    computeStudentGPA,
    finalizeGrades,
    fetchStudentGPA,
    updateGradeComponent,
    fetchSystemSettings,
  };
}
