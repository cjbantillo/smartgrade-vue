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

  return {
    loading,
    error,
    fetchTeachers,
    fetchPendingTeachers,
    approveTeacher,
    upsertTeacher,
    deactivateTeacher,
    fetchAuditLogs,
    getAuditLogDetails,
  };
}
