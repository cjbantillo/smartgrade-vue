import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuth } from "./useAuth";

// Certificate Types
export type CertificateType = "honors" | "good_moral" | "completion";

// Certificate Data Interface
export interface Certificate {
  id: string;
  student_id: string;
  certificate_type: CertificateType;
  school_year_id: string;
  issued_date: string;
  pdf_url: string | null;
  qr_code_url: string | null;
  is_revoked: boolean;
  revoked_by: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  generated_by: string;
  generated_at: string;
}

// Certificate with Student Info
export interface CertificateWithStudent extends Certificate {
  student: {
    lrn: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    grade_level: string;
    track: string;
    strand: string;
  };
  school_year: {
    year_code: string;
  };
  general_average: number;
  honors_designation: string | null;
}

// Certificate Verification Data
export interface CertificateVerification {
  valid: boolean;
  certificate: CertificateWithStudent | null;
  error: string | null;
}

export function useCertificates() {
  const authStore = useAuth();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Check if grades are finalized before certificate generation
   */
  async function checkFinalization(
    studentId: string,
    schoolYearId: string
  ): Promise<boolean> {
    try {
      const { data, error: fetchError } = await supabase
        .from("grade_finalization_status")
        .select("is_finalized")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .eq("semester", "1")
        .single();

      if (fetchError) {
        console.error("Finalization check error:", fetchError);
        return false;
      }

      return data?.is_finalized || false;
    } catch (err) {
      console.error("Unexpected error checking finalization:", err);
      return false;
    }
  }

  /**
   * Get student's GPA and honors designation
   */
  async function getStudentGPA(
    studentId: string,
    schoolYearId: string
  ): Promise<{ gpa: number; honors: string | null }> {
    try {
      const { data, error: fetchError } = await supabase
        .from("grade_finalization_status")
        .select("general_average")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .eq("semester", "1")
        .single();

      if (fetchError || !data) {
        return { gpa: 0, honors: null };
      }

      const gpa = data.general_average || 0;

      // Determine honors designation based on GPA
      let honors: string | null = null;
      if (gpa >= 98) {
        honors = "With Highest Honors";
      } else if (gpa >= 95) {
        honors = "With High Honors";
      } else if (gpa >= 90) {
        honors = "With Honors";
      }

      return { gpa, honors };
    } catch (err) {
      console.error("Error fetching GPA:", err);
      return { gpa: 0, honors: null };
    }
  }

  /**
   * Generate verification code for certificate
   * Format: CERT-YYYY-XXXXXXXX (e.g., CERT-2024-A1B2C3D4)
   */
  function generateVerificationCode(year: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CERT-${year}-${code}`;
  }

  /**
   * Generate certificate for a student
   */
  async function generateCertificate(
    studentId: string,
    schoolYearId: string,
    certificateType: CertificateType
  ): Promise<Certificate | null> {
    loading.value = true;
    error.value = null;

    try {
      // Check if grades are finalized
      const isFinalized = await checkFinalization(studentId, schoolYearId);
      if (!isFinalized) {
        error.value =
          "Cannot generate certificate: Grades must be finalized first";
        return null;
      }

      // Get GPA and honors
      const { gpa, honors } = await getStudentGPA(studentId, schoolYearId);

      // For honors certificate, check if student qualifies
      if (certificateType === "honors" && !honors) {
        error.value =
          "Student does not qualify for honors certificate (GPA must be 90 or above)";
        return null;
      }

      // Get school year code for verification code
      const { data: schoolYear } = await supabase
        .from("school_years")
        .select("year_code")
        .eq("id", schoolYearId)
        .single();

      const yearCode =
        schoolYear?.year_code.split("-")[0] ||
        new Date().getFullYear().toString();

      // Check if certificate already exists (prevent duplicates)
      const { data: existingCert } = await supabase
        .from("certificates")
        .select("id")
        .eq("student_id", studentId)
        .eq("school_year_id", schoolYearId)
        .eq("certificate_type", certificateType)
        .eq("is_revoked", false)
        .single();

      if (existingCert) {
        error.value = "Certificate already exists for this student and type";
        return null;
      }

      // Generate verification code
      const verificationCode = generateVerificationCode(yearCode);

      // Create certificate record
      const { data: certificate, error: insertError } = await supabase
        .from("certificates")
        .insert({
          student_id: studentId,
          certificate_type: certificateType,
          school_year_id: schoolYearId,
          issued_date: new Date().toISOString().split("T")[0],
          generated_by: authStore.user?.id,
          qr_code_url: verificationCode, // Store verification code in qr_code_url field
        })
        .select()
        .single();

      if (insertError) {
        console.error("Certificate creation error:", insertError);
        error.value = "Failed to generate certificate";
        return null;
      }

      // Log to audit logs
      await supabase.from("audit_logs").insert({
        user_id: authStore.user?.id,
        action: `${certificateType}_certificate_generated`,
        entity_type: "Certificate",
        entity_id: certificate.id,
        details: `Generated ${certificateType} certificate for student ${studentId}`,
        ip_address: "system",
        user_agent: "SmartGrade System",
      });

      return certificate;
    } catch (err) {
      console.error("Unexpected error generating certificate:", err);
      error.value = "An unexpected error occurred";
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch certificates for a student
   */
  async function fetchStudentCertificates(
    studentId: string,
    schoolYearId?: string
  ): Promise<CertificateWithStudent[]> {
    loading.value = true;
    error.value = null;

    try {
      let query = supabase
        .from("certificates")
        .select(
          `
          *,
          student:student_id (
            lrn,
            first_name,
            last_name,
            middle_name,
            grade_level,
            track,
            strand
          ),
          school_year:school_year_id (
            year_code
          )
        `
        )
        .eq("student_id", studentId)
        .eq("is_revoked", false)
        .order("generated_at", { ascending: false });

      if (schoolYearId) {
        query = query.eq("school_year_id", schoolYearId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Fetch certificates error:", fetchError);
        error.value = "Failed to fetch certificates";
        return [];
      }

      // Enrich with GPA and honors
      const enrichedCertificates = await Promise.all(
        (data || []).map(async (cert: any) => {
          const { gpa, honors } = await getStudentGPA(
            cert.student_id,
            cert.school_year_id
          );
          return {
            ...cert,
            general_average: gpa,
            honors_designation: honors,
          };
        })
      );

      return enrichedCertificates;
    } catch (err) {
      console.error("Unexpected error fetching certificates:", err);
      error.value = "An unexpected error occurred";
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Verify certificate by verification code (public access)
   */
  async function verifyCertificate(
    verificationCode: string
  ): Promise<CertificateVerification> {
    loading.value = true;
    error.value = null;

    try {
      // Find certificate by verification code
      const { data: certificate, error: fetchError } = await supabase
        .from("certificates")
        .select(
          `
          *,
          student:student_id (
            lrn,
            first_name,
            last_name,
            middle_name,
            grade_level,
            track,
            strand
          ),
          school_year:school_year_id (
            year_code
          )
        `
        )
        .eq("qr_code_url", verificationCode)
        .single();

      if (fetchError || !certificate) {
        return {
          valid: false,
          certificate: null,
          error: "Certificate not found or invalid verification code",
        };
      }

      // Check if revoked
      if (certificate.is_revoked) {
        return {
          valid: false,
          certificate: null,
          error: `Certificate has been revoked. Reason: ${
            certificate.revocation_reason || "Not specified"
          }`,
        };
      }

      // Get GPA and honors
      const { gpa, honors } = await getStudentGPA(
        certificate.student_id,
        certificate.school_year_id
      );

      return {
        valid: true,
        certificate: {
          ...certificate,
          general_average: gpa,
          honors_designation: honors,
        },
        error: null,
      };
    } catch (err) {
      console.error("Unexpected error verifying certificate:", err);
      return {
        valid: false,
        certificate: null,
        error: "An unexpected error occurred during verification",
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Revoke a certificate (admin only)
   */
  async function revokeCertificate(
    certificateId: string,
    reason: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("certificates")
        .update({
          is_revoked: true,
          revoked_by: authStore.user?.id,
          revoked_at: new Date().toISOString(),
          revocation_reason: reason,
        })
        .eq("id", certificateId);

      if (updateError) {
        console.error("Certificate revocation error:", updateError);
        error.value = "Failed to revoke certificate";
        return false;
      }

      // Log to audit logs
      await supabase.from("audit_logs").insert({
        user_id: authStore.user?.id,
        action: "certificate_revoked",
        entity_type: "Certificate",
        entity_id: certificateId,
        details: `Revoked certificate. Reason: ${reason}`,
        ip_address: "system",
        user_agent: "SmartGrade System",
      });

      return true;
    } catch (err) {
      console.error("Unexpected error revoking certificate:", err);
      error.value = "An unexpected error occurred";
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    checkFinalization,
    getStudentGPA,
    generateVerificationCode,
    generateCertificate,
    fetchStudentCertificates,
    verifyCertificate,
    revokeCertificate,
  };
}
