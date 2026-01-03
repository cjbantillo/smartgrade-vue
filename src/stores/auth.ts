import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "adviser" | "teacher" | "student";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  school_id: number | null;
  first_name: string;
  last_name: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const profile = ref<UserProfile | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const role = computed(() => profile.value?.role ?? null);
  const fullName = computed(() =>
    profile.value
      ? `${profile.value.first_name} ${profile.value.last_name}`
      : ""
  );

  async function fetchProfile(userId: string) {
    const { data, error: err } = await supabase
      .from("users")
      .select("id, email, role, school_id, first_name, last_name")
      .eq("id", userId)
      .single();

    if (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
    return data as UserProfile;
  }

  async function initialize() {
    loading.value = true;
    try {
      const { data, error: err } = await supabase.auth.getSession();
      if (err) throw err;

      session.value = data.session;
      user.value = data.session?.user ?? null;

      if (user.value) {
        profile.value = await fetchProfile(user.value.id);
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading.value = false;
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(
      async (_event: string, newSession: typeof session.value) => {
        session.value = newSession;
        user.value = newSession?.user ?? null;

        if (user.value) {
          profile.value = await fetchProfile(user.value.id);
        } else {
          profile.value = null;
        }
      }
    );
  }

  async function signInWithEmail(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;

      user.value = data.user;
      session.value = data.session;

      if (user.value) {
        profile.value = await fetchProfile(user.value.id);
      }

      return { success: true };
    } catch (err: any) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }

  async function signInWithGoogle() {
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    }
    return { success: true };
  }

  async function signOut() {
    await supabase.auth.signOut();
    user.value = null;
    session.value = null;
    profile.value = null;
  }

  function hasRole(roles: UserRole | UserRole[]) {
    if (!profile.value) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(profile.value.role);
  }

  return {
    user,
    session,
    profile,
    loading,
    error,
    isAuthenticated,
    role,
    fullName,
    initialize,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    hasRole,
  };
});
