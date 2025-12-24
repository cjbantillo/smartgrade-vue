/**
 * Form Validation & Unsaved Changes Composable
 * Provides reusable form validation and data loss prevention
 */

import { ref, computed, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import type { Ref } from "vue";

export interface ValidationRule {
  (value: any): boolean | string;
}

export interface FormField {
  value: any;
  rules: ValidationRule[];
  errors: string[];
}

/**
 * Grade validation rules
 */
export const gradeRules: ValidationRule[] = [
  (v) => v === null || v === "" || !isNaN(Number(v)) || "Must be a number",
  (v) => v === null || v === "" || Number(v) >= 0 || "Grade cannot be negative",
  (v) =>
    v === null || v === "" || Number(v) <= 100 || "Grade cannot exceed 100",
  (v) =>
    v === null ||
    v === "" ||
    /^\d+(\.\d{1,2})?$/.test(v.toString()) ||
    "Maximum 2 decimal places",
];

/**
 * LRN validation rules
 */
export const lrnRules: ValidationRule[] = [
  (v) => !!v || "LRN is required",
  (v) => v.length === 12 || "LRN must be exactly 12 digits",
  (v) => /^\d+$/.test(v) || "LRN must contain only numbers",
];

/**
 * Email validation rules
 */
export const emailRules: ValidationRule[] = [
  (v) => !!v || "Email is required",
  (v) => /.+@.+\..+/.test(v) || "Email must be valid",
];

/**
 * DepEd email validation rules
 */
export const depedEmailRules: ValidationRule[] = [
  ...emailRules,
  (v) => v.endsWith("@deped.gov.ph") || "Must be a @deped.gov.ph email address",
];

/**
 * Required field rule
 */
export const requiredRule: ValidationRule = (v) =>
  !!v || "This field is required";

/**
 * Password strength rules
 */
export const passwordRules: ValidationRule[] = [
  (v) => !!v || "Password is required",
  (v) => v.length >= 8 || "Password must be at least 8 characters",
  (v) =>
    /[A-Z]/.test(v) || "Password must contain at least one uppercase letter",
  (v) =>
    /[a-z]/.test(v) || "Password must contain at least one lowercase letter",
  (v) => /\d/.test(v) || "Password must contain at least one number",
];

/**
 * Composable for form validation
 */
export function useFormValidation() {
  const formErrors = ref<string[]>([]);
  const isValid = ref(true);

  /**
   * Validate a single field
   */
  function validateField(value: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      const result = rule(value);
      if (result !== true && typeof result === "string") {
        errors.push(result);
      }
    }

    return errors;
  }

  /**
   * Validate entire form
   */
  function validateForm(
    fields: Record<string, { value: any; rules: ValidationRule[] }>
  ): boolean {
    formErrors.value = [];
    isValid.value = true;

    for (const [fieldName, field] of Object.entries(fields)) {
      const errors = validateField(field.value, field.rules);
      if (errors.length > 0) {
        formErrors.value.push(...errors.map((err) => `${fieldName}: ${err}`));
        isValid.value = false;
      }
    }

    return isValid.value;
  }

  /**
   * Clear all form errors
   */
  function clearErrors() {
    formErrors.value = [];
    isValid.value = true;
  }

  return {
    formErrors,
    isValid,
    validateField,
    validateForm,
    clearErrors,
  };
}

/**
 * Composable for unsaved changes detection
 */
export function useUnsavedChanges(data: Ref<any>) {
  const hasUnsavedChanges = ref(false);
  const originalData = ref<any>(null);
  const showWarningDialog = ref(false);
  const pendingNavigation = ref<(() => void) | null>(null);

  /**
   * Mark data as saved (set baseline)
   */
  function markAsSaved() {
    originalData.value = JSON.parse(JSON.stringify(data.value));
    hasUnsavedChanges.value = false;
  }

  /**
   * Check if data has changed
   */
  function checkForChanges() {
    if (!originalData.value) {
      hasUnsavedChanges.value = false;
      return;
    }

    const current = JSON.stringify(data.value);
    const original = JSON.stringify(originalData.value);
    hasUnsavedChanges.value = current !== original;
  }

  // Watch for changes
  watch(data, checkForChanges, { deep: true });

  /**
   * Navigation guard
   */
  onBeforeRouteLeave((to, from, next) => {
    if (!hasUnsavedChanges.value) {
      next();
      return;
    }

    // Show warning dialog
    showWarningDialog.value = true;
    pendingNavigation.value = () => {
      hasUnsavedChanges.value = false; // Prevent re-trigger
      next();
    };

    // Block navigation
    next(false);
  });

  /**
   * Handle discard changes
   */
  function discardChanges() {
    hasUnsavedChanges.value = false;
    showWarningDialog.value = false;
    if (pendingNavigation.value) {
      pendingNavigation.value();
      pendingNavigation.value = null;
    }
  }

  /**
   * Handle save and leave
   */
  async function saveAndLeave(saveFn: () => Promise<void>) {
    try {
      await saveFn();
      hasUnsavedChanges.value = false;
      showWarningDialog.value = false;
      if (pendingNavigation.value) {
        pendingNavigation.value();
        pendingNavigation.value = null;
      }
    } catch (error) {
      console.error("Failed to save before leaving:", error);
      // Keep dialog open, let user decide
    }
  }

  /**
   * Cancel navigation
   */
  function cancelNavigation() {
    showWarningDialog.value = false;
    pendingNavigation.value = null;
  }

  return {
    hasUnsavedChanges,
    showWarningDialog,
    markAsSaved,
    discardChanges,
    saveAndLeave,
    cancelNavigation,
  };
}

/**
 * Composable for confirmation dialogs
 */
export function useConfirmDialog() {
  const showDialog = ref(false);
  const dialogTitle = ref("");
  const dialogMessage = ref("");
  const dialogType = ref<"warning" | "error" | "info">("warning");
  const confirmCallback = ref<(() => void) | null>(null);

  /**
   * Show confirmation dialog
   */
  function confirm(
    title: string,
    message: string,
    callback: () => void,
    type: "warning" | "error" | "info" = "warning"
  ) {
    dialogTitle.value = title;
    dialogMessage.value = message;
    dialogType.value = type;
    confirmCallback.value = callback;
    showDialog.value = true;
  }

  /**
   * Handle confirm
   */
  function handleConfirm() {
    if (confirmCallback.value) {
      confirmCallback.value();
    }
    showDialog.value = false;
    confirmCallback.value = null;
  }

  /**
   * Handle cancel
   */
  function handleCancel() {
    showDialog.value = false;
    confirmCallback.value = null;
  }

  return {
    showDialog,
    dialogTitle,
    dialogMessage,
    dialogType,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
