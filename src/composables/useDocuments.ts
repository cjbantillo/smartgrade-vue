import html2pdf from "html2pdf.js";
import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import { type ErrorResponse, handleError } from "@/utils/errorHandling";

// Document Metadata Interface
export interface DocumentMetadata {
  id: string;
  student_id: string;
  document_type: "SF9" | "SF10";
  school_year_id: string;
  data: Record<string, any>;
  updated_at: string;
  updated_by: string;
}

export interface SF9Data {
  // Student Information
  student_id: string;
  lrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  grade_level: number;
  section: string;
  track?: string;
  strand?: string;
  school_year: string;

  // Grades by Subject
  subjects: SF9Subject[];

  // Computed
  general_average?: number;
  remarks?: string;

  // Editable Fields (metadata only, not grades)
  adviser_name?: string;
  principal_name?: string;
  date_issued?: string;
  remarks_text?: string;
}

export interface SF9Subject {
  subject_code: string;
  subject_name: string;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  remarks: string | null;
}

export interface SF10Data {
  // Student Information
  student_id: string;
  lrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birthdate?: string;
  birthplace?: string;
  gender?: string;

  // Academic History
  school_years: SF10SchoolYear[];

  // Editable Metadata
  parent_guardian?: string;
  contact_number?: string;
  address?: string;
  remarks_text?: string;
}

export interface SF10SchoolYear {
  year: string;
  grade_level: number;
  section: string;
  subjects: SF10Subject[];
  general_average: number | null;
  remarks: string | null;
}

export interface SF10Subject {
  subject_code: string;
  subject_name: string;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  remarks: string | null;
}

export interface DocumentEdit {
  id?: string;
  document_type: "SF9" | "SF10";
  student_id: string;
  school_year_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  edited_by: string;
  edited_at: string;
}

export function useDocuments() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<ErrorResponse | null>(null);
  const isEditing = ref(false);

  /**
   * Check if grades are finalized (required before document generation)
   */
  async function checkFinalization(
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
   * Generate SF9 (Report Card) data for a student
   */
  async function generateSF9(
    studentId: string,
    schoolYearId: string
  ): Promise<SF9Data | null> {
    loading.value = true;
    error.value = null;

    try {
      // Check if grades are finalized
      const isFinalized = await checkFinalization(studentId, schoolYearId, "1");

      if (!isFinalized) {
        throw new Error("Cannot generate SF9: Grades must be finalized first");
      }

      // Get student information
      const { data: student } = await supabase
        .from("students")
        .select(
          `
          id,
          lrn,
          first_name,
          middle_name,
          last_name,
          grade_level,
          track,
          strand
        `
        )
        .eq("id", studentId)
        .single();

      if (!student) {
        throw new Error("Student not found");
      }

      // Get school year
      const { data: schoolYear } = await supabase
        .from("school_years")
        .select("year")
        .eq("id", schoolYearId)
        .single();

      // Get all grades for this student in this school year
      const { data: grades } = await supabase
        .from("grades")
        .select(
          `
          grading_period_id,
          subject_id,
          quarterly_grade,
          remarks,
          subjects:subject_id (
            code,
            name
          ),
          grading_periods:grading_period_id (
            period_number
          )
        `
        )
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .order("subject_id");

      // Get final grades
      const { data: finalGrades } = await supabase
        .from("final_grades")
        .select(
          `
          subject_id,
          q1_grade,
          q2_grade,
          final_grade,
          remarks,
          subjects:subject_id (
            code,
            name
          )
        `
        )
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .eq("semester", "1");

      // Organize grades by subject
      const subjectMap = new Map<string, SF9Subject>();

      // Add quarterly grades
      if (grades) {
        for (const g of grades) {
          const subjectId = g.subject_id;
          const period = g.grading_periods?.period_number;

          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              subject_code: g.subjects?.code || "",
              subject_name: g.subjects?.name || "",
              q1_grade: null,
              q2_grade: null,
              q3_grade: null,
              q4_grade: null,
              final_grade: null,
              remarks: null,
            });
          }

          const subject = subjectMap.get(subjectId)!;
          if (period === 1) {
            subject.q1_grade = g.quarterly_grade;
          }
          if (period === 2) {
            subject.q2_grade = g.quarterly_grade;
          }
          if (period === 3) {
            subject.q3_grade = g.quarterly_grade;
          }
          if (period === 4) {
            subject.q4_grade = g.quarterly_grade;
          }
        }
      }

      // Add final grades
      if (finalGrades) {
        for (const fg of finalGrades) {
          const subject = subjectMap.get(fg.subject_id);
          if (subject) {
            subject.final_grade = fg.final_grade;
            subject.remarks = fg.remarks;
          }
        }
      }

      // Calculate general average
      const finalGradesList = Array.from(subjectMap.values())
        .map((s) => s.final_grade)
        .filter((g) => g !== null) as number[];

      const generalAverage =
        finalGradesList.length > 0
          ? Math.round(
              (finalGradesList.reduce((sum, g) => sum + g, 0) /
                finalGradesList.length) *
                100
            ) / 100
          : undefined;

      // Get finalization status for metadata
      const { data: finalizationData } = await supabase
        .from("grade_finalization_status")
        .select("general_average")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .eq("semester", "1")
        .single();

      return {
        student_id: student.id,
        lrn: student.lrn,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        grade_level: student.grade_level,
        section: "TBD", // Get from class enrollment
        track: student.track,
        strand: student.strand,
        school_year: schoolYear?.year || "",
        subjects: Array.from(subjectMap.values()),
        general_average: finalizationData?.general_average || generalAverage,
        remarks: generalAverage && generalAverage >= 75 ? "PASSED" : "FAILED",
      };
    } catch (error_) {
      const errorResponse = handleError(error_, "generating SF9");
      error.value = errorResponse;
      console.error("Error generating SF9:", error_);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Generate SF10 (Permanent Record) data for a student
   */
  async function generateSF10(studentId: string): Promise<SF10Data | null> {
    loading.value = true;
    error.value = null;

    try {
      // Get student information
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (!student) {
        throw new Error("Student not found");
      }

      // Get all school years the student has grades in
      const { data: schoolYears } = await supabase
        .from("grades")
        .select(
          `
          school_year_id,
          school_years:school_year_id (
            id,
            year
          )
        `
        )
        .eq("student_id", studentId);

      const uniqueSchoolYears = Array.from(
        new Set(schoolYears?.map((g) => g.school_year_id))
      );

      const schoolYearData: SF10SchoolYear[] = [];

      // Get grades for each school year
      for (const syId of uniqueSchoolYears) {
        const sy = schoolYears?.find(
          (g) => g.school_year_id === syId
        )?.school_years;

        // Get all grades for this school year
        const { data: grades } = await supabase
          .from("grades")
          .select(
            `
            grading_period_id,
            subject_id,
            quarterly_grade,
            subjects:subject_id (
              code,
              name
            ),
            grading_periods:grading_period_id (
              period_number
            )
          `
          )
          .eq("student_id", studentId)
          .eq("school_year_id", syId);

        // Get final grades
        const { data: finalGrades } = await supabase
          .from("final_grades")
          .select(
            `
            subject_id,
            q1_grade,
            q2_grade,
            final_grade,
            remarks
          `
          )
          .eq("student_id", studentId)
          .eq("school_year_id", syId);

        // Organize by subject
        const subjectMap = new Map<string, SF10Subject>();

        if (grades) {
          for (const g of grades) {
            const subjectId = g.subject_id;
            const period = g.grading_periods?.period_number;

            if (!subjectMap.has(subjectId)) {
              subjectMap.set(subjectId, {
                subject_code: g.subjects?.code || "",
                subject_name: g.subjects?.name || "",
                q1_grade: null,
                q2_grade: null,
                q3_grade: null,
                q4_grade: null,
                final_grade: null,
                remarks: null,
              });
            }

            const subject = subjectMap.get(subjectId)!;
            if (period === 1) {
              subject.q1_grade = g.quarterly_grade;
            }
            if (period === 2) {
              subject.q2_grade = g.quarterly_grade;
            }
            if (period === 3) {
              subject.q3_grade = g.quarterly_grade;
            }
            if (period === 4) {
              subject.q4_grade = g.quarterly_grade;
            }
          }
        }

        if (finalGrades) {
          for (const fg of finalGrades) {
            const subject = subjectMap.get(fg.subject_id);
            if (subject) {
              subject.final_grade = fg.final_grade;
              subject.remarks = fg.remarks;
            }
          }
        }

        // Calculate general average
        const finalGradesList = Array.from(subjectMap.values())
          .map((s) => s.final_grade)
          .filter((g) => g !== null) as number[];

        const generalAverage =
          finalGradesList.length > 0
            ? Math.round(
                (finalGradesList.reduce((sum, g) => sum + g, 0) /
                  finalGradesList.length) *
                  100
              ) / 100
            : null;

        schoolYearData.push({
          year: sy?.year || "",
          grade_level: student.grade_level,
          section: "TBD",
          subjects: Array.from(subjectMap.values()),
          general_average: generalAverage,
          remarks: generalAverage && generalAverage >= 75 ? "PASSED" : "FAILED",
        });
      }

      return {
        student_id: student.id,
        lrn: student.lrn,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        school_years: schoolYearData,
      };
    } catch (error_) {
      const errorResponse = handleApiError(error_, "generating SF10");
      error.value = errorResponse;
      console.error("Error generating SF10:", error_);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Log document edit (metadata fields only, NOT grades)
   */
  async function logDocumentEdit(
    documentType: "SF9" | "SF10",
    studentId: string,
    schoolYearId: string,
    fieldName: string,
    oldValue: string | null,
    newValue: string | null
  ): Promise<boolean> {
    try {
      const currentUser = await authStore.getUser();
      if (!currentUser) {
        console.error("No authenticated user for document edit log");
        return false;
      }

      const { error: insertError } = await supabase
        .from("document_edits")
        .insert({
          document_type: documentType,
          student_id: studentId,
          school_year_id: schoolYearId,
          field_name: fieldName,
          old_value: oldValue,
          new_value: newValue,
          edited_by: currentUser.id,
        });

      if (insertError) {
        throw insertError;
      }

      // Also log in audit_logs
      await supabase.from("audit_logs").insert({
        user_id: currentUser.id,
        action: `${documentType.toLowerCase()}_edited`,
        entity_type: documentType,
        entity_id: studentId,
        old_values: { [fieldName]: oldValue },
        new_values: { [fieldName]: newValue },
      });

      return true;
    } catch (error_) {
      console.error("Error logging document edit:", error_);
      return false;
    }
  }

  /**
   * Get document edit history
   */
  async function fetchDocumentEdits(
    documentType: "SF9" | "SF10",
    studentId: string,
    schoolYearId: string
  ): Promise<DocumentEdit[]> {
    const { data } = await supabase
      .from("document_edits")
      .select("*")
      .eq("document_type", documentType)
      .eq("student_id", studentId)
      .eq("school_year_id", schoolYearId)
      .order("edited_at", { ascending: false });

    return data || [];
  }

  /**
   * Generate PDF from HTML element and upload to Supabase Storage
   */
  async function generatePDF(
    htmlElement: HTMLElement,
    documentType: "SF9" | "SF10",
    studentId: string,
    schoolYearId?: string
  ): Promise<string> {
    try {
      // Generate PDF blob
      const pdfBlob = await html2pdf()
        .set({
          margin: 10,
          filename: `${documentType}-${studentId}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "legal", orientation: "portrait" },
        })
        .from(htmlElement)
        .outputPdf("blob");

      // Upload to Supabase Storage
      const fileName = schoolYearId
        ? `${studentId}/${schoolYearId}/${documentType}_${Date.now()}.pdf`
        : `${studentId}/${documentType}_${Date.now()}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, pdfBlob, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(uploadData.path);

      // Log to audit_logs
      const currentUser = await authStore.getUser();
      if (currentUser) {
        await supabase.from("audit_logs").insert({
          user_id: currentUser.id,
          action: `${documentType.toLowerCase()}_pdf_generated`,
          entity_type: documentType,
          entity_id: studentId,
          metadata: {
            description: `Generated ${documentType} PDF for student ${studentId}`,
            document_type: documentType,
            student_id: studentId,
          },
        });
      }

      return urlData.publicUrl;
    } catch (error_) {
      const errorResponse = handleError(
        error_,
        `generating ${documentType} PDF`
      );
      error.value = errorResponse;
      throw error_;
    }
  }

  /**
   * Save metadata for SF9/SF10 documents (attendance, observed values, etc.)
   */
  async function saveMetadata(
    studentId: string,
    documentType: "SF9" | "SF10",
    schoolYearId: string,
    data: Record<string, any>
  ): Promise<DocumentMetadata | null> {
    try {
      const currentUser = await authStore.getUser();
      if (!currentUser) {
        throw new Error("No authenticated user");
      }

      const { data: result, error: upsertError } = await supabase
        .from("document_metadata")
        .upsert(
          {
            student_id: studentId,
            document_type: documentType,
            school_year_id: schoolYearId,
            data,
            updated_at: new Date().toISOString(),
            updated_by: currentUser.id,
          },
          {
            onConflict: "student_id,document_type,school_year_id",
          }
        )
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      // Log to audit trail
      await supabase.from("audit_logs").insert({
        user_id: currentUser.id,
        action: `${documentType.toLowerCase()}_metadata_saved`,
        entity_type: documentType,
        entity_id: studentId,
        metadata: {
          description: `Saved ${documentType} metadata for student ${studentId}`,
          document_type: documentType,
          student_id: studentId,
        },
      });

      return result as DocumentMetadata;
    } catch (error_) {
      const errorResponse = handleError(error_, "saving document metadata");
      error.value = errorResponse;
      return null;
    }
  }

  /**
   * Get metadata for SF9/SF10 documents
   */
  async function getMetadata(
    studentId: string,
    documentType: "SF9" | "SF10",
    schoolYearId: string
  ): Promise<DocumentMetadata | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from("document_metadata")
        .select("*")
        .eq("student_id", studentId)
        .eq("document_type", documentType)
        .eq("school_year_id", schoolYearId)
        .single();

      if (fetchError) {
        // Not found is OK (returns null)
        if (fetchError.code === "PGRST116") {
          return null;
        }
        throw fetchError;
      }

      return data as DocumentMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Generate SF10 cumulative data for all school years
   */
  async function generateSF10Data(studentId: string): Promise<SF10Data | null> {
    loading.value = true;
    error.value = null;

    try {
      // Fetch student info
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(
          `
          *,
          profiles!inner(email)
        `
        )
        .eq("id", studentId)
        .single();

      if (studentError) {
        throw studentError;
      }
      if (!student) {
        throw new Error("Student not found");
      }

      // Fetch all final grades across all school years
      const { data: allGrades, error: gradesError } = await supabase
        .from("final_grades")
        .select(
          `
          *,
          school_years!inner(year, is_active),
          teacher_classes!inner(
            grade_level,
            section,
            subjects(code, name)
          ),
          grade_finalization_status!inner(is_finalized)
        `
        )
        .eq("student_id", studentId)
        .order("school_years(year)", { ascending: true });

      if (gradesError) {
        throw gradesError;
      }

      // Group grades by school year
      const schoolYearsMap = new Map<string, SF10SchoolYear>();

      for (const grade of allGrades || []) {
        const year = grade.school_years.year;

        if (!schoolYearsMap.has(year)) {
          schoolYearsMap.set(year, {
            year,
            grade_level: grade.teacher_classes.grade_level,
            section: grade.teacher_classes.section,
            subjects: [],
            general_average: null,
            remarks: null,
          });
        }

        const yearData = schoolYearsMap.get(year)!;
        yearData.subjects.push({
          subject_code: grade.teacher_classes.subjects.code,
          subject_name: grade.teacher_classes.subjects.name,
          q1_grade: grade.q1_grade,
          q2_grade: grade.q2_grade,
          q3_grade: grade.q3_grade,
          q4_grade: grade.q4_grade,
          final_grade: grade.final_grade,
          remarks: grade.remarks,
        });
      }

      // Calculate general averages per year
      for (const yearData of schoolYearsMap.values()) {
        const finalGrades = yearData.subjects
          .map((s) => s.final_grade)
          .filter((g) => g !== null) as number[];

        if (finalGrades.length > 0) {
          yearData.general_average =
            finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length;
        }
      }

      const sf10Data: SF10Data = {
        student_id: student.id,
        lrn: student.lrn,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        birthdate: student.birthdate,
        birthplace: student.birthplace,
        gender: student.gender,
        school_years: Array.from(schoolYearsMap.values()),
      };

      return sf10Data;
    } catch (error_) {
      const errorResponse = handleError(error_, "generating SF10 data");
      error.value = errorResponse;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    isEditing,
    checkFinalization,
    generateSF9,
    generateSF10,
    generateSF10Data,
    saveMetadata,
    getMetadata,
    logDocumentEdit,
    fetchDocumentEdits,
    generatePDF,
  };
}
