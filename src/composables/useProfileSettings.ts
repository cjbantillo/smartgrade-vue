import { ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

/**
 * User profile interface
 */
export interface UserProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  role: "admin" | "teacher" | "student";
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Teacher profile with additional fields
 */
export interface TeacherProfile extends UserProfile {
  department?: string;
  qualification?: string;
  specialization?: string;
}

/**
 * Student profile with additional fields
 */
export interface StudentProfile {
  id: string;
  user_id: string;
  lrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date?: string;
  gender?: "M" | "F";
  track?: string;
  strand?: string;
  grade_level: number;
  created_at: string;
  updated_at: string;
}

/**
 * School settings interface
 */
export interface SchoolSettings {
  id: string;
  school_name: string;
  school_year_from: number;
  school_year_to: number;
  current_school_year: string;
  current_semester: "1" | "2";
  passing_grade: number;
  honors_with_honors_threshold: number;
  honors_with_high_honors_threshold: number;
  honors_with_highest_honors_threshold: number;
  written_work_percentage: number;
  performance_task_percentage: number;
  quarterly_assessment_percentage: number;
  updated_by: string;
  updated_at: string;
}

/**
 * Profile and Settings CRUD operations
 */
export function useProfileSettings() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * READ: Fetch current user's profile
   */
  async function fetchCurrentProfile(): Promise<UserProfile | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User not authenticated");
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authStore.profile.user_id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch profile";
      console.error("Error fetching profile:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Modify current user's profile
   */
  async function updateProfile(
    updates: Partial<
      Omit<UserProfile, "user_id" | "role" | "is_approved" | "created_at">
    >
  ): Promise<UserProfile | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User not authenticated");
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", authStore.profile.user_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local auth store
      authStore.profile = data;

      // Log audit trail
      if (authStore.profile?.user_id) {
        await supabase.from("audit_logs").insert({
          user_id: authStore.profile.user_id,
          action: "profile_updated",
          table_name: "profiles",
          record_id: authStore.profile.user_id,
          new_values: updates,
        });
      }

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update profile";
      console.error("Error updating profile:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Change password
   */
  async function changePassword(newPassword: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile?.user_id,
        action: "password_changed",
        table_name: "auth.users",
        record_id: authStore.profile?.user_id || "",
      });

      return true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to change password";
      console.error("Error changing password:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch a specific user's profile (Admin only)
   */
  async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    loading.value = true;
    error.value = null;

    try {
      // Verify caller is admin
      if (authStore.profile?.role !== "admin") {
        throw new Error("Insufficient permissions");
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch user profile";
      console.error("Error fetching user profile:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch student profile
   */
  async function fetchStudentProfile(
    studentId: string
  ): Promise<StudentProfile | null> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch student profile";
      console.error("Error fetching student profile:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Modify student profile (Teacher/Admin only)
   */
  async function updateStudentProfile(
    studentId: string,
    updates: Partial<Omit<StudentProfile, "id" | "user_id" | "created_at">>
  ): Promise<StudentProfile | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User not authenticated");
      }

      const { data, error: updateError } = await supabase
        .from("students")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "student_profile_updated",
        table_name: "students",
        record_id: studentId,
        new_values: updates,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update student profile";
      console.error("Error updating student profile:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Fetch school settings
   */
  async function fetchSchoolSettings(): Promise<SchoolSettings | null> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("school_settings")
        .select("*")
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      return data || null;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch school settings";
      console.error("Error fetching school settings:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * CREATE: Initialize school settings
   */
  async function createSchoolSettings(
    settings: Omit<SchoolSettings, "id" | "updated_by" | "updated_at">
  ): Promise<SchoolSettings | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User not authenticated");
      }

      if (authStore.profile.role !== "admin") {
        throw new Error("Only admins can create school settings");
      }

      const { data, error: insertError } = await supabase
        .from("school_settings")
        .insert({
          ...settings,
          updated_by: authStore.profile.user_id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "school_settings_created",
        table_name: "school_settings",
        record_id: data.id,
        new_values: settings,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create school settings";
      console.error("Error creating school settings:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE: Modify school settings (Admin only)
   */
  async function updateSchoolSettings(
    updates: Partial<Omit<SchoolSettings, "id" | "updated_by" | "updated_at">>
  ): Promise<SchoolSettings | null> {
    loading.value = true;
    error.value = null;

    try {
      if (!authStore.profile?.user_id) {
        throw new Error("User not authenticated");
      }

      if (authStore.profile.role !== "admin") {
        throw new Error("Only admins can modify school settings");
      }

      const { data, error: updateError } = await supabase
        .from("school_settings")
        .update({
          ...updates,
          updated_by: authStore.profile.user_id,
          updated_at: new Date().toISOString(),
        })
        .limit(1)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "school_settings_updated",
        table_name: "school_settings",
        record_id: data.id,
        new_values: updates,
      });

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update school settings";
      console.error("Error updating school settings:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Get all users (Admin only)
   */
  async function fetchAllUsers(
    role?: "admin" | "teacher" | "student"
  ): Promise<UserProfile[]> {
    loading.value = true;
    error.value = null;

    try {
      if (authStore.profile?.role !== "admin") {
        throw new Error("Insufficient permissions");
      }

      let query = supabase.from("profiles").select("*");

      if (role) {
        query = query.eq("role", role);
      }

      const { data, error: fetchError } = await query.order("created_at", {
        ascending: false,
      });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch users";
      console.error("Error fetching users:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * READ: Get all students
   */
  async function fetchAllStudents(
    gradeLevel?: number
  ): Promise<StudentProfile[]> {
    loading.value = true;
    error.value = null;

    try {
      let query = supabase.from("students").select("*");

      if (gradeLevel) {
        query = query.eq("grade_level", gradeLevel);
      }

      const { data, error: fetchError } = await query.order("last_name", {
        ascending: true,
      });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch students";
      console.error("Error fetching students:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * SEARCH: Search users by email or name
   */
  async function searchUsers(query: string): Promise<UserProfile[]> {
    loading.value = true;
    error.value = null;

    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = query.trim();

      const { data, error: searchError } = await supabase
        .from("profiles")
        .select("*")
        .or(
          `email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
        )
        .limit(20);

      if (searchError) {
        throw searchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to search users";
      console.error("Error searching users:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * SEARCH: Search students by LRN, name, or email
   */
  async function searchStudents(query: string): Promise<StudentProfile[]> {
    loading.value = true;
    error.value = null;

    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = query.trim();

      const { data, error: searchError } = await supabase
        .from("students")
        .select("*")
        .or(
          `lrn.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
        )
        .limit(20);

      if (searchError) {
        throw searchError;
      }

      return data || [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to search students";
      console.error("Error searching students:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    fetchCurrentProfile,
    updateProfile,
    changePassword,
    fetchUserProfile,
    fetchStudentProfile,
    updateStudentProfile,
    fetchSchoolSettings,
    createSchoolSettings,
    updateSchoolSettings,
    fetchAllUsers,
    fetchAllStudents,
    searchUsers,
    searchStudents,
  };
}
