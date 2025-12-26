import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

/**
 * Admin interface - from profiles table
 */
export interface AdminProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Teacher approval request interface
 */
export interface TeacherApprovalRequest {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

/**
 * Grade unlock request interface
 */
export interface UnlockRequest {
  id: string;
  student_id: string;
  school_year_id: string;
  semester: "1" | "2";
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_by_teacher: string;
  requested_at: string;
  approved_by_admin?: string;
  approved_at?: string;
  admin_notes?: string;
}

/**
 * System settings interface
 */
export interface SystemSettings {
  id: string;
  school_name: string;
  passing_grade: number;
  honors_high_honors_threshold: number;
  honors_with_honors_threshold: number;
  honors_with_highest_honors_threshold: number;
  written_work_percentage: number;
  performance_task_percentage: number;
  quarterly_assessment_percentage: number;
  current_school_year: string;
  updated_at: string;
  updated_by: string;
}

/**
 * Audit log interface
 */
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

/**
 * Admin CRUD operations
 */
export function useAdmin() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * READ: Fetch all pending teacher approval requests
   */
  async function fetchPendingTeachers(): Promise<TeacherApprovalRequest[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          email,
          first_name,
          last_name,
          is_approved,
          is_active,
          created_at
        `
        )
        .eq("role", "teacher")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch pending teachers";
      console.error("Error fetching pending teachers:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch all approved teachers
   */
  async function fetchApprovedTeachers(): Promise<AdminProfile[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          email,
          first_name,
          last_name,
          is_active,
          is_approved,
          created_at,
          updated_at
        `
        )
        .eq("role", "teacher")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : "Failed to fetch approved teachers";
      console.error("Error fetching approved teachers:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Approve a teacher
   */
  async function approveTeacher(teacherId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Admin profile not found");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", teacherId);

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "TEACHER_APPROVED",
        table_name: "profiles",
        record_id: teacherId,
        new_values: { is_approved: true },
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to approve teacher";
      console.error("Error approving teacher:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Reject/Deactivate a teacher
   */
  async function rejectTeacher(
    teacherId: string,
    reason?: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Admin profile not found");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", teacherId);

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "TEACHER_REJECTED",
        table_name: "profiles",
        record_id: teacherId,
        new_values: { is_active: false },
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to reject teacher";
      console.error("Error rejecting teacher:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch all pending unlock requests
   */
  async function fetchUnlockRequests(
    status: "pending" | "approved" | "rejected" | "all" = "pending"
  ): Promise<UnlockRequest[]> {
    loading.value = true;
    error.value = null;

    try {
      let query = supabase.from("grade_unlock_requests").select(
        `
          id,
          student_id,
          school_year_id,
          semester,
          reason,
          status,
          requested_by_teacher,
          requested_at,
          approved_by_admin,
          approved_at,
          admin_notes
        `
      );

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error: fetchError } = await query.order("requested_at", {
        ascending: false,
      });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch unlock requests";
      console.error("Error fetching unlock requests:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Approve a grade unlock request
   */
  async function approveUnlockRequest(
    requestId: string,
    notes?: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Admin profile not found");
      }

      // Get the unlock request details
      const { data: request } = await supabase
        .from("grade_unlock_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!request) {
        throw new Error("Unlock request not found");
      }

      // Update the unlock request
      const { error: updateError } = await supabase
        .from("grade_unlock_requests")
        .update({
          status: "approved",
          approved_by_admin: authStore.profile.user_id,
          approved_at: new Date().toISOString(),
          admin_notes: notes,
        })
        .eq("id", requestId);

      if (updateError) {
        throw updateError;
      }

      // Update the finalization status to UNLOCKED
      const { error: finalizeError } = await supabase
        .from("grade_finalization_status")
        .update({
          is_finalized: false,
          unlock_count: (request.unlock_count || 0) + 1,
        })
        .eq("student_id", request.student_id)
        .eq("school_year_id", request.school_year_id)
        .eq("semester", request.semester);

      if (finalizeError) {
        throw finalizeError;
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "GRADE_UNLOCK_APPROVED",
        table_name: "grade_unlock_requests",
        record_id: requestId,
        new_values: { status: "approved" },
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to approve unlock request";
      console.error("Error approving unlock request:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Reject a grade unlock request
   */
  async function rejectUnlockRequest(
    requestId: string,
    notes?: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Admin profile not found");
      }

      const { error: updateError } = await supabase
        .from("grade_unlock_requests")
        .update({
          status: "rejected",
          approved_by_admin: authStore.profile.user_id,
          approved_at: new Date().toISOString(),
          admin_notes: notes,
        })
        .eq("id", requestId);

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "GRADE_UNLOCK_REJECTED",
        table_name: "grade_unlock_requests",
        record_id: requestId,
        new_values: { status: "rejected" },
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to reject unlock request";
      console.error("Error rejecting unlock request:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch system settings
   */
  async function fetchSystemSettings(): Promise<SystemSettings | null> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("system_settings")
        .select("*")
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      return data || null;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch system settings";
      console.error("Error fetching system settings:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * CREATE: Initialize system settings (for new school year)
   */
  async function createSystemSettings(
    settings: Omit<SystemSettings, "id" | "updated_at" | "updated_by">
  ): Promise<SystemSettings | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Admin profile not found");
      }

      const { data, error: insertError } = await supabase
        .from("system_settings")
        .insert({
          ...settings,
          updated_by: authStore.profile.user_id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "SYSTEM_SETTINGS_CREATED",
        table_name: "system_settings",
        record_id: data.id,
        new_values: settings,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create system settings";
      console.error("Error creating system settings:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Modify system settings
   */
  async function updateSystemSettings(
    settingsId: string,
    settings: Partial<Omit<SystemSettings, "id" | "updated_at" | "updated_by">>
  ): Promise<SystemSettings | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("Admin profile not found");
      }

      const { data, error: updateError } = await supabase
        .from("system_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: authStore.profile.user_id,
        })
        .eq("id", settingsId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "SYSTEM_SETTINGS_UPDATED",
        table_name: "system_settings",
        record_id: data.id,
        new_values: settings,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update system settings";
      console.error("Error updating system settings:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch audit logs
   */
  async function fetchAuditLogs(filters?: {
    user_id?: string;
    action?: string;
    table_name?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    loading.value = true;
    error.value = null;

    try {
      let query = supabase.from("audit_logs").select(
        `
          id,
          user_id,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at,
          profiles!audit_logs_user_id_fkey (email, first_name, last_name)
        `
      );

      if (filters?.user_id) {
        query = query.eq("user_id", filters.user_id);
      }

      if (filters?.action) {
        query = query.ilike("action", `%${filters.action}%`);
      }

      if (filters?.table_name) {
        query = query.eq("table_name", filters.table_name);
      }

      if (filters?.start_date) {
        query = query.gte("created_at", filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte("created_at", filters.end_date);
      }

      const { data, error: fetchError } = await query
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 100);

      if (fetchError) {
        throw fetchError;
      }

      return (data || []).map((log) => ({
        ...log,
        user_email: (log.profiles as any)?.email,
        user_name: `${(log.profiles as any)?.first_name} ${
          (log.profiles as any)?.last_name
        }`,
      }));
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch audit logs";
      console.error("Error fetching audit logs:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    fetchPendingTeachers,
    fetchApprovedTeachers,
    approveTeacher,
    rejectTeacher,
    fetchUnlockRequests,
    approveUnlockRequest,
    rejectUnlockRequest,
    fetchSystemSettings,
    createSystemSettings,
    updateSystemSettings,
    fetchAuditLogs,
  };
}
