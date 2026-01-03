import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";

type UserRole = "admin" | "teacher" | "adviser" | "student" | null;

export interface UserProfile {
  user_id: number;
  email: string;
  role: string;
  school_id: number;
  is_active: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  const profile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!profile.value);

  const role = computed<UserRole>(() => {
    if (!profile.value) return null;
    const r = profile.value.role.toLowerCase();
    if (r === "admin") return "admin";
    if (r === "teacher") return "teacher";
    if (r === "adviser") return "adviser";
    if (r === "student") return "student";
    return null;
  });

  const fullName = computed(() => profile.value?.email || "");
  const user = computed(() => profile.value);

  async function initialize() {
    if (initialized.value) return;
    loading.value = true;

    const savedUser = localStorage.getItem("smartgrade_user");
    if (savedUser) {
      try {
        profile.value = JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("smartgrade_user");
      }
    }

    initialized.value = true;
    loading.value = false;
  }

  async function signInWithEmail(email: string, password: string) {
    loading.value = true;

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !userData) {
        loading.value = false;
        return { success: false, error: "Invalid login credentials" };
      }

      // Simple password verification for demo
      const validPasswords: Record<string, string> = {
        admin123:
          "$2a$10$N9qo8uLOickgx2ZMRZoMye1e5HG8X5h7kJBZN3g1lJ.k8QOvZ7rCi",
        teacher123:
          "$2a$10$YQ8DGrT8tKNpqIwvCy3kZeGzVb5sY9nGxGvYkH5XvQ1hLY8fSdZbO",
        password:
          "$2a$10$e0MYzXyjpJS7Pd0RVvHwHeNpPj.VmZGHbKo.E8cJvAYOdDZ.1Tn.i",
      };

      let isValid = false;
      for (const [plainPass, hash] of Object.entries(validPasswords)) {
        if (userData.password_hash === hash && password === plainPass) {
          isValid = true;
          break;
        }
      }

      if (!isValid) {
        loading.value = false;
        return { success: false, error: "Invalid login credentials" };
      }

      profile.value = {
        user_id: userData.user_id,
        email: userData.email,
        role: userData.role,
        school_id: userData.school_id,
        is_active: userData.is_active,
      };
      localStorage.setItem("smartgrade_user", JSON.stringify(profile.value));

      loading.value = false;
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      loading.value = false;
      return { success: false, error: "Login failed" };
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async function signOut() {
    profile.value = null;
    localStorage.removeItem("smartgrade_user");
    await supabase.auth.signOut();
  }

  return {
    profile,
    user,
    loading,
    initialized,
    isAuthenticated,
    role,
    fullName,
    initialize,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };
});
