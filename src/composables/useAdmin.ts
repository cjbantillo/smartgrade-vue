/**
 * Admin Composable
 * Handles admin-specific operations for teacher management, audit logs, etc.
 *
 * PHASE 13: Admin Module
 * - Teacher CRUD operations
 * - Teacher approval workflow
 * - Audit log queries with pagination
 */

import type { Database } from "@/types/supabase";

import { ref } from "vue";

import { supabase } from "@/services/supabase";

type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type TeacherInsert = Database["public"]["Tables"]["teachers"]["Insert"];
type TeacherUpdate = Database["public"]["Tables"]["teachers"]["Update"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

export interface TeacherWithProfile extends Teacher {
  profiles?: Profile | null;
}

export interface AuditLogWithUser extends AuditLog {
  profiles?: Pick<Profile, "first_name" | "last_name" | "email"> | null;
}

export interface PaginatedAuditLogs {
  data: AuditLogWithUser[];
  total: number;
}

export interface PreRegisterTeacherPayload {
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  employee_number?: string;
  department?: string;
  specialization?: string;
  contact_number?: string;
}

export interface UnlockGradesPayload {
  student_id: string;
  school_year_id: string;
  semester: string;
  reason: string;
}

export function useAdmin() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch all teachers with their profile data
   */
  async function fetchTeachers(): Promise<TeacherWithProfile[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("teachers")
        .select(
          `
          *,
          profiles (*)
        `
        )
        .order("created_at", { ascending: false });

      if (fetchError) {
        error.value = "Failed to fetch teachers";
        console.error("[Admin] Fetch teachers error:", fetchError);
        return [];
      }

      return data as TeacherWithProfile[];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch pending teacher approvals (users with teacher role but not approved)
   */
  async function fetchPendingTeachers(): Promise<Profile[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

      if (fetchError) {
        error.value = "Failed to fetch pending teachers";
        console.error("[Admin] Fetch pending teachers error:", fetchError);
        return [];
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Approve a teacher account
   */
  async function approveTeacher(
    userId: string,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_approved: true,
          is_active: true,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        error.value = "Failed to approve teacher";
        console.error("[Admin] Approve teacher error:", updateError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create or update teacher record
   */
  async function upsertTeacher(
    teacher: TeacherInsert | TeacherUpdate,
    teacherId?: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (teacherId) {
        // Update existing
        const { error: updateError } = await supabase
          .from("teachers")
          .update(teacher as TeacherUpdate)
          .eq("id", teacherId);

        if (updateError) {
          error.value = "Failed to update teacher";
          console.error("[Admin] Update teacher error:", updateError);
          return false;
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("teachers")
          .insert(teacher as TeacherInsert);

        if (insertError) {
          error.value = "Failed to create teacher";
          console.error("[Admin] Insert teacher error:", insertError);
          return false;
        }
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Deactivate teacher account
   */
  async function deactivateTeacher(userId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("user_id", userId);

      if (updateError) {
        error.value = "Failed to deactivate teacher";
        console.error("[Admin] Deactivate teacher error:", updateError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch audit logs with pagination and user details
   */
  async function fetchAuditLogs(
    page = 1,
    pageSize = 50
  ): Promise<PaginatedAuditLogs> {
    loading.value = true;
    error.value = null;

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get total count
      const { count } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true });

      // Get paginated data with user info
      const { data, error: fetchError } = await supabase
        .from("audit_logs")
        .select(
          `
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (fetchError) {
        error.value = "Failed to fetch audit logs";
        console.error("[Admin] Fetch audit logs error:", fetchError);
        return { data: [], total: 0 };
      }

      return {
        data: data as AuditLogWithUser[],
        total: count || 0,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return { data: [], total: 0 };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get audit log details by ID
   */
  async function getAuditLogDetails(
    logId: string
  ): Promise<AuditLogWithUser | null> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("audit_logs")
        .select(
          `
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("id", logId)
        .single();

      if (fetchError) {
        error.value = "Failed to fetch audit log details";
        console.error("[Admin] Fetch audit log details error:", fetchError);
        return null;
      }

      return data as AuditLogWithUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reject a teacher account
   * Sets is_approved and is_active to false, logs to audit
   */
  async function rejectTeacher(
    userId: string,
    reason: string,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_approved: false,
          is_active: false,
        })
        .eq("user_id", userId);

      if (updateError) {
        error.value = "Failed to reject teacher";
        console.error("[Admin] Reject teacher error:", updateError);
        return false;
      }

      // Log to audit
      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: adminId,
        action: "teacher_rejected",
        entity_type: "Profile",
        entity_id: userId,
        metadata: { reason },
        new_values: { is_approved: false, rejection_reason: reason },
      });

      if (auditError) {
        console.error("[Admin] Audit log error:", auditError);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pre-register a teacher (store invite)
   * Email validation enforced via CHECK constraint in DB
   */
  async function preRegisterTeacher(
    payload: PreRegisterTeacherPayload,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Validate email format
      const depedEmailRegex = /^[a-zA-Z0-9._%+-]+@deped\.gov\.ph$/;
      if (!depedEmailRegex.test(payload.email)) {
        error.value = "Email must be a valid @deped.gov.ph address";
        return false;
      }

      // Check if email already exists in profiles
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", payload.email)
        .single();

      if (existingProfile) {
        error.value = "This email is already registered in the system";
        return false;
      }

      // Check if invite already exists
      const { data: existingInvite } = await supabase
        .from("teacher_invites")
        .select("id, status")
        .eq("email", payload.email)
        .single();

      if (existingInvite && existingInvite.status === "pending") {
        error.value = "An active invite already exists for this email";
        return false;
      }

      // Create invite
      const { data: inviteData, error: insertError } = await supabase
        .from("teacher_invites")
        .insert({
          email: payload.email,
          first_name: payload.first_name,
          last_name: payload.last_name,
          middle_name: payload.middle_name,
          employee_number: payload.employee_number,
          department: payload.department,
          specialization: payload.specialization,
          contact_number: payload.contact_number,
          invited_by: adminId,
        })
        .select("id")
        .single();

      if (insertError || !inviteData) {
        error.value = "Failed to create teacher invite";
        console.error("[Admin] Create invite error:", insertError);
        return false;
      }

      // Log to audit
      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: adminId,
        action: "teacher_pre_registered",
        entity_type: "TeacherInvite",
        entity_id: inviteData.id,
        metadata: {
          description: `Pre-registered teacher: ${payload.first_name} ${payload.last_name}`,
          email: payload.email,
        },
        new_values: payload,
      });

      if (auditError) {
        console.error("[Admin] Audit log error:", auditError);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Unlock finalized grades
   * Updates grade_finalization_status and logs to audit
   */
  async function unlockFinalizedGrades(
    payload: UnlockGradesPayload,
    adminId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // First check if grades are actually finalized
      const { data: currentStatus, error: checkError } = await supabase
        .from("grade_finalization_status")
        .select("is_finalized, unlock_count")
        .eq("student_id", payload.student_id)
        .eq("school_year_id", payload.school_year_id)
        .eq("semester", payload.semester)
        .single();

      if (checkError) {
        error.value = "Finalization record not found";
        console.error("[Admin] Check finalization error:", checkError);
        return false;
      }

      if (!currentStatus?.is_finalized) {
        error.value = "Grades are not finalized";
        return false;
      }

      // Update finalization status
      const { error: updateError } = await supabase
        .from("grade_finalization_status")
        .update({
          is_finalized: false,
          unlock_count: (currentStatus.unlock_count || 0) + 1,
          last_unlocked_at: new Date().toISOString(),
          last_unlocked_by: adminId,
        })
        .eq("student_id", payload.student_id)
        .eq("school_year_id", payload.school_year_id)
        .eq("semester", payload.semester);

      if (updateError) {
        error.value = "Failed to unlock grades";
        console.error("[Admin] Unlock grades error:", updateError);
        return false;
      }

      // Log to audit
      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: adminId,
        action: "grade_unlocked",
        entity_type: "GradeFinalization",
        entity_id: `${payload.student_id}-${payload.school_year_id}-${payload.semester}`,
        metadata: {
          reason: payload.reason,
          student_id: payload.student_id,
          semester: payload.semester,
          unlock_count: (currentStatus.unlock_count || 0) + 1,
        },
        new_values: {
          is_finalized: false,
          unlock_count: (currentStatus.unlock_count || 0) + 1,
        },
      });

      if (auditError) {
        console.error("[Admin] Audit log error:", auditError);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch teacher invites
   */
  async function fetchTeacherInvites(): Promise<any[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("teacher_invites")
        .select("*")
        .order("invited_at", { ascending: false });

      if (fetchError) {
        error.value = "Failed to fetch teacher invites";
        console.error("[Admin] Fetch invites error:", fetchError);
        return [];
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Admin] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    fetchTeachers,
    fetchPendingTeachers,
    approveTeacher,
    upsertTeacher,
    deactivateTeacher,
    rejectTeacher,
    preRegisterTeacher,
    unlockFinalizedGrades,
    fetchTeacherInvites,
    fetchAuditLogs,
    getAuditLogDetails,
  };
}
