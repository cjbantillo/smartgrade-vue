export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      classes: {
        Row: {
          capacity: number | null
          created_at: string
          grade_level: string
          id: string
          room: string | null
          school_year_id: string
          section_name: string
          semester: string
          strand: string | null
          teacher_id: string | null
          track: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          grade_level: string
          id?: string
          room?: string | null
          school_year_id: string
          section_name: string
          semester: string
          strand?: string | null
          teacher_id?: string | null
          track: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          grade_level?: string
          id?: string
          room?: string | null
          school_year_id?: string
          section_name?: string
          semester?: string
          strand?: string | null
          teacher_id?: string | null
          track?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}
