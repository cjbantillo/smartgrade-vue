/**
 * System Settings Composable
 * Handles system configuration for school identity, signatories, and grading rules
 *
 * PHASE 13: Admin Module
 * - School identity (name, ID, logo)
 * - Signatories for documents
 * - Grading configuration (passing grade, honors thresholds)
 * - School year and subject management
 */

import type { Database } from "@/types/supabase";

import { ref } from "vue";

import { supabase } from "@/services/supabase";

type SystemSetting = Database["public"]["Tables"]["system_settings"]["Row"];
type SchoolYear = Database["public"]["Tables"]["school_years"]["Row"];
type SchoolYearInsert = Database["public"]["Tables"]["school_years"]["Insert"];
type SchoolYearUpdate = Database["public"]["Tables"]["school_years"]["Update"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type SubjectInsert = Database["public"]["Tables"]["subjects"]["Insert"];
type SubjectUpdate = Database["public"]["Tables"]["subjects"]["Update"];

export interface SystemSettings {
  school_name?: string;
  school_id?: string;
  school_logo?: string;
  principal_name?: string;
  superintendent_name?: string;
  passing_grade?: number;
  honors_threshold?: number;
  high_honors_threshold?: number;
  highest_honors_threshold?: number;
}

export function useSystemSettings() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch all system settings
   */
  async function fetchSettings(): Promise<SystemSettings> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("system_settings")
        .select("*");

      if (fetchError) {
        error.value = "Failed to fetch system settings";
        console.error("[Settings] Fetch error:", fetchError);
        return {};
      }

      // Convert array of settings to object
      const settings: SystemSettings = {};
      data?.forEach((setting: SystemSetting) => {
        const key = setting.setting_key as keyof SystemSettings;
        const value = setting.setting_value;

        // Parse numeric values
        if (key.includes("grade") || key.includes("threshold")) {
          settings[key] = value ? Number.parseFloat(value) : undefined;
        } else {
          settings[key] = value || undefined;
        }
      });

      return settings;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Settings] Exception:", err);
      return {};
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update a single system setting
   */
  async function updateSetting(key: string, value: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: upsertError } = await supabase
        .from("system_settings")
        .upsert(
          {
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "setting_key",
          }
        );

      if (upsertError) {
        error.value = `Failed to update setting: ${key}`;
        console.error("[Settings] Update error:", upsertError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Settings] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update multiple system settings at once
   */
  async function updateSettings(settings: SystemSettings): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const settingsArray = Object.entries(settings)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
          setting_key: key,
          setting_value: String(value),
          updated_at: new Date().toISOString(),
        }));

      if (settingsArray.length === 0) {
        return true;
      }

      const { error: upsertError } = await supabase
        .from("system_settings")
        .upsert(settingsArray, {
          onConflict: "setting_key",
        });

      if (upsertError) {
        error.value = "Failed to update settings";
        console.error("[Settings] Batch update error:", upsertError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Settings] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Upload school logo to Supabase Storage
   */
  async function uploadSchoolLogo(file: File): Promise<string | null> {
    loading.value = true;
    error.value = null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `school-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        error.value = "Failed to upload logo";
        console.error("[Settings] Upload error:", uploadError);
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Settings] Exception:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // ==================== School Years ====================

  /**
   * Fetch all school years
   */
  async function fetchSchoolYears(): Promise<SchoolYear[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("school_years")
        .select("*")
        .order("year_start", { ascending: false });

      if (fetchError) {
        error.value = "Failed to fetch school years";
        console.error("[SchoolYears] Fetch error:", fetchError);
        return [];
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[SchoolYears] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create school year
   */
  async function createSchoolYear(
    schoolYear: SchoolYearInsert
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: insertError } = await supabase
        .from("school_years")
        .insert(schoolYear);

      if (insertError) {
        error.value = "Failed to create school year";
        console.error("[SchoolYears] Insert error:", insertError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[SchoolYears] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update school year
   */
  async function updateSchoolYear(
    id: string,
    updates: SchoolYearUpdate
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("school_years")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        error.value = "Failed to update school year";
        console.error("[SchoolYears] Update error:", updateError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[SchoolYears] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set active school year (deactivates all others)
   */
  async function setActiveSchoolYear(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // First, deactivate all school years
      const { error: deactivateError } = await supabase
        .from("school_years")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

      if (deactivateError) {
        error.value = "Failed to deactivate school years";
        console.error("[SchoolYears] Deactivate error:", deactivateError);
        return false;
      }

      // Then, activate the selected one
      const { error: activateError } = await supabase
        .from("school_years")
        .update({ is_active: true })
        .eq("id", id);

      if (activateError) {
        error.value = "Failed to activate school year";
        console.error("[SchoolYears] Activate error:", activateError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[SchoolYears] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete school year
   */
  async function deleteSchoolYear(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from("school_years")
        .delete()
        .eq("id", id);

      if (deleteError) {
        error.value = "Failed to delete school year";
        console.error("[SchoolYears] Delete error:", deleteError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[SchoolYears] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ==================== Subjects ====================

  /**
   * Fetch all subjects
   */
  async function fetchSubjects(): Promise<Subject[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("subjects")
        .select("*")
        .order("subject_code");

      if (fetchError) {
        error.value = "Failed to fetch subjects";
        console.error("[Subjects] Fetch error:", fetchError);
        return [];
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Subjects] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create subject
   */
  async function createSubject(subject: SubjectInsert): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: insertError } = await supabase
        .from("subjects")
        .insert(subject);

      if (insertError) {
        error.value = "Failed to create subject";
        console.error("[Subjects] Insert error:", insertError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Subjects] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update subject
   */
  async function updateSubject(
    id: string,
    updates: SubjectUpdate
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("subjects")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        error.value = "Failed to update subject";
        console.error("[Subjects] Update error:", updateError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Subjects] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete subject
   */
  async function deleteSubject(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id);

      if (deleteError) {
        error.value = "Failed to delete subject";
        console.error("[Subjects] Delete error:", deleteError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Subjects] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch grading periods for a school year
   */
  async function fetchGradingPeriods(schoolYearId: string): Promise<any[]> {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("grading_periods")
        .select("*")
        .eq("school_year_id", schoolYearId)
        .order("period_number", { ascending: true });

      if (fetchError) {
        error.value = "Failed to fetch grading periods";
        console.error("[Grading Periods] Fetch error:", fetchError);
        return [];
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Grading Periods] Exception:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create grading period
   */
  async function createGradingPeriod(period: any): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: insertError } = await supabase
        .from("grading_periods")
        .insert(period);

      if (insertError) {
        error.value = "Failed to create grading period";
        console.error("[Grading Periods] Create error:", insertError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Grading Periods] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update grading period
   */
  async function updateGradingPeriod(
    id: string,
    updates: any
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await supabase
        .from("grading_periods")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        error.value = "Failed to update grading period";
        console.error("[Grading Periods] Update error:", updateError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Grading Periods] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set active grading period (only one active per school year)
   * Transactional: deactivate all, then activate one
   */
  async function setActiveGradingPeriod(
    periodId: string,
    schoolYearId: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Deactivate all periods for this school year
      const { error: deactivateError } = await supabase
        .from("grading_periods")
        .update({ is_active: false })
        .eq("school_year_id", schoolYearId);

      if (deactivateError) {
        error.value = "Failed to deactivate existing periods";
        console.error("[Grading Periods] Deactivate error:", deactivateError);
        return false;
      }

      // Activate target period
      const { error: activateError } = await supabase
        .from("grading_periods")
        .update({ is_active: true })
        .eq("id", periodId);

      if (activateError) {
        error.value = "Failed to activate grading period";
        console.error("[Grading Periods] Activate error:", activateError);
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error.value = message;
      console.error("[Grading Periods] Exception:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    // System Settings
    fetchSettings,
    updateSetting,
    updateSettings,
    uploadSchoolLogo,
    // School Years
    fetchSchoolYears,
    createSchoolYear,
    updateSchoolYear,
    setActiveSchoolYear,
    deleteSchoolYear,
    // Grading Periods
    fetchGradingPeriods,
    createGradingPeriod,
    updateGradingPeriod,
    setActiveGradingPeriod,
    // Subjects
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
  };
}
