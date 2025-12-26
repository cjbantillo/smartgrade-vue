import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

/**
 * SF9 Report Card interface
 */
export interface SF9Document {
  id: string;
  student_id: string;
  school_year_id: string;
  semester: "1" | "2";
  created_by: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published";
  // Custom fields that may be edited
  student_name?: string;
  track?: string;
  strand?: string;
  grade_level?: number;
  adviser_name?: string;
  school_name?: string;
  school_year?: string;
  pdf_path?: string;
}

/**
 * SF10 Permanent Record interface
 */
export interface SF10Document {
  id: string;
  student_id: string;
  school_year_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published";
  // Custom fields
  student_name?: string;
  lrn?: string;
  birth_date?: string;
  mother_name?: string;
  father_name?: string;
  track?: string;
  grade_level?: number;
  adviser_name?: string;
  school_name?: string;
  pdf_path?: string;
}

/**
 * Certificate interface
 */
export interface Certificate {
  id: string;
  student_id: string;
  school_year_id: string;
  certificate_type: "honors" | "high_honors" | "highest_honors" | "good_moral";
  created_by: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published";
  pdf_path?: string;
  issued_date?: string;
  gpa?: number;
  remarks?: string;
}

/**
 * Document metadata for storage
 */
export interface DocumentMetadata {
  id: string;
  document_type: "sf9" | "sf10" | "certificate";
  student_id: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_by: string;
  created_at: string;
  storage_path?: string;
}

/**
 * Document CRUD operations
 */
export function useDocuments() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * CREATE: Generate SF9 Report Card
   */
  async function createSF9Document(
    studentId: string,
    schoolYearId: string,
    semester: "1" | "2",
    customFields?: Partial<SF9Document>
  ): Promise<SF9Document | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      // Verify student has finalized grades
      const { data: finalized } = await supabase
        .from("grade_finalization_status")
        .select("is_finalized")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .eq("semester", semester)
        .single();

      if (!finalized?.is_finalized) {
        throw new Error(
          "Student grades must be finalized before generating SF9"
        );
      }

      // Fetch student details
      const { data: student } = await supabase
        .from("students")
        .select(
          "id, lrn, first_name, middle_name, last_name, track, strand, grade_level"
        )
        .eq("id", studentId)
        .single();

      if (!student) {
        throw new Error("Student not found");
      }

      const { data, error: insertError } = await supabase
        .from("sf9_documents")
        .insert({
          student_id: studentId,
          school_year_id: schoolYearId,
          semester,
          created_by: authStore.profile.user_id,
          status: "draft",
          student_name:
            customFields?.student_name ||
            `${student.first_name} ${student.last_name}`,
          track: customFields?.track || student.track,
          strand: customFields?.strand || student.strand,
          grade_level: customFields?.grade_level || student.grade_level,
          adviser_name: customFields?.adviser_name,
          school_name: customFields?.school_name,
          school_year: customFields?.school_year,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "sf9_created",
        table_name: "sf9_documents",
        record_id: data.id,
        new_values: { student_id: studentId, semester },
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create SF9 document";
      console.error("Error creating SF9:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Edit SF9 Document
   */
  async function updateSF9Document(
    documentId: string,
    updates: Partial<Omit<SF9Document, "id" | "created_by" | "created_at">>
  ): Promise<SF9Document | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      const { data, error: updateError } = await supabase
        .from("sf9_documents")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .eq("created_by", authStore.profile.user_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "sf9_updated",
        table_name: "sf9_documents",
        record_id: documentId,
        new_values: updates,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update SF9 document";
      console.error("Error updating SF9:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * DELETE: Remove SF9 Document
   */
  async function deleteSF9Document(documentId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      // Get document details
      const { data: doc } = await supabase
        .from("sf9_documents")
        .select("pdf_path")
        .eq("id", documentId)
        .single();

      // Delete from storage if PDF exists
      if (doc?.pdf_path) {
        await supabase.storage.from("documents").remove([doc.pdf_path]);
      }

      const { error: deleteError } = await supabase
        .from("sf9_documents")
        .delete()
        .eq("id", documentId)
        .eq("created_by", authStore.profile.user_id);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "sf9_deleted",
        table_name: "sf9_documents",
        record_id: documentId,
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete SF9 document";
      console.error("Error deleting SF9:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * CREATE: Generate SF10 Permanent Record
   */
  async function createSF10Document(
    studentId: string,
    schoolYearId: string,
    customFields?: Partial<SF10Document>
  ): Promise<SF10Document | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      // Verify student has finalized grades for the year
      const { data: finalized } = await supabase
        .from("grade_finalization_status")
        .select("is_finalized")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .limit(1);

      if (!finalized || finalized.length === 0) {
        throw new Error("Student has no finalized grades for this school year");
      }

      // Fetch student details
      const { data: student } = await supabase
        .from("students")
        .select(
          "id, lrn, first_name, middle_name, last_name, birth_date, track, grade_level"
        )
        .eq("id", studentId)
        .single();

      if (!student) {
        throw new Error("Student not found");
      }

      const { data, error: insertError } = await supabase
        .from("sf10_documents")
        .insert({
          student_id: studentId,
          school_year_id: schoolYearId,
          created_by: authStore.profile.user_id,
          status: "draft",
          student_name:
            customFields?.student_name ||
            `${student.first_name} ${student.last_name}`,
          lrn: customFields?.lrn || student.lrn,
          birth_date: customFields?.birth_date || student.birth_date,
          track: customFields?.track || student.track,
          grade_level: customFields?.grade_level || student.grade_level,
          adviser_name: customFields?.adviser_name,
          school_name: customFields?.school_name,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "sf10_created",
        table_name: "sf10_documents",
        record_id: data.id,
        new_values: { student_id: studentId },
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create SF10 document";
      console.error("Error creating SF10:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Edit SF10 Document
   */
  async function updateSF10Document(
    documentId: string,
    updates: Partial<Omit<SF10Document, "id" | "created_by" | "created_at">>
  ): Promise<SF10Document | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      const { data, error: updateError } = await supabase
        .from("sf10_documents")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .eq("created_by", authStore.profile.user_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "sf10_updated",
        table_name: "sf10_documents",
        record_id: documentId,
        new_values: updates,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update SF10 document";
      console.error("Error updating SF10:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * DELETE: Remove SF10 Document
   */
  async function deleteSF10Document(documentId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      // Get document details
      const { data: doc } = await supabase
        .from("sf10_documents")
        .select("pdf_path")
        .eq("id", documentId)
        .single();

      // Delete from storage if PDF exists
      if (doc?.pdf_path) {
        await supabase.storage.from("documents").remove([doc.pdf_path]);
      }

      const { error: deleteError } = await supabase
        .from("sf10_documents")
        .delete()
        .eq("id", documentId)
        .eq("created_by", authStore.profile.user_id);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "sf10_deleted",
        table_name: "sf10_documents",
        record_id: documentId,
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete SF10 document";
      console.error("Error deleting SF10:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * CREATE: Generate Certificate
   */
  async function createCertificate(
    studentId: string,
    schoolYearId: string,
    certificateType: Certificate["certificate_type"],
    customFields?: Partial<Certificate>
  ): Promise<Certificate | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      // Verify student has finalized grades
      const { data: gpa } = await supabase
        .from("grade_finalization_status")
        .select("general_average")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .single();

      if (!gpa) {
        throw new Error(
          "Student grades must be finalized before issuing certificate"
        );
      }

      // Verify GPA meets certificate requirements
      const honors_thresholds = {
        highest_honors: 98,
        high_honors: 95,
        honors: 90,
        good_moral: 0, // No GPA requirement
      };

      if (
        certificateType !== "good_moral" &&
        gpa.general_average < honors_thresholds[certificateType]
      ) {
        throw new Error(
          `Student GPA (${gpa.general_average}) does not meet ${certificateType} requirement`
        );
      }

      const { data, error: insertError } = await supabase
        .from("certificates")
        .insert({
          student_id: studentId,
          school_year_id: schoolYearId,
          certificate_type: certificateType,
          created_by: authStore.profile.user_id,
          status: "draft",
          gpa: gpa.general_average,
          issued_date:
            customFields?.issued_date || new Date().toISOString().split("T")[0],
          remarks: customFields?.remarks,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "certificate_created",
        table_name: "certificates",
        record_id: data.id,
        new_values: {
          certificate_type: certificateType,
          gpa: gpa.general_average,
        },
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create certificate";
      console.error("Error creating certificate:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Modify Certificate
   */
  async function updateCertificate(
    certificateId: string,
    updates: Partial<Omit<Certificate, "id" | "created_by" | "created_at">>
  ): Promise<Certificate | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      const { data, error: updateError } = await supabase
        .from("certificates")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", certificateId)
        .eq("created_by", authStore.profile.user_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "certificate_updated",
        table_name: "certificates",
        record_id: certificateId,
        new_values: updates,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update certificate";
      console.error("Error updating certificate:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * DELETE: Remove Certificate
   */
  async function deleteCertificate(certificateId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User profile not found");
      }

      // Get certificate details
      const { data: cert } = await supabase
        .from("certificates")
        .select("pdf_path")
        .eq("id", certificateId)
        .single();

      // Delete from storage if PDF exists
      if (cert?.pdf_path) {
        await supabase.storage.from("certificates").remove([cert.pdf_path]);
      }

      const { error: deleteError } = await supabase
        .from("certificates")
        .delete()
        .eq("id", certificateId)
        .eq("created_by", authStore.profile.user_id);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "certificate_deleted",
        table_name: "certificates",
        record_id: certificateId,
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete certificate";
      console.error("Error deleting certificate:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch SF9 documents for a student
   */
  async function fetchStudentSF9s(studentId: string): Promise<SF9Document[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("sf9_documents")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch SF9 documents";
      console.error("Error fetching SF9s:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch SF10 documents for a student
   */
  async function fetchStudentSF10s(studentId: string): Promise<SF10Document[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("sf10_documents")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch SF10 documents";
      console.error("Error fetching SF10s:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch certificates for a student
   */
  async function fetchStudentCertificates(
    studentId: string
  ): Promise<Certificate[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch certificates";
      console.error("Error fetching certificates:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    createSF9Document,
    updateSF9Document,
    deleteSF9Document,
    createSF10Document,
    updateSF10Document,
    deleteSF10Document,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    fetchStudentSF9s,
    fetchStudentSF10s,
    fetchStudentCertificates,
  };
}
