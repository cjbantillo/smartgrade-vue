/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />
/// <reference types="vite-plugin-vue-layouts-next/client" />

/**
 * TypeScript definitions for environment variables
 * Ensures type safety when accessing import.meta.env
 */
interface ImportMetaEnv {
  /** Supabase project URL */
  readonly VITE_SUPABASE_URL: string
  /** Supabase anonymous/public API key */
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Base URL for the application */
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
