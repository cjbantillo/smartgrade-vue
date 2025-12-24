export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      archived_students: {
        Row: {
          archived_at: string;
          archived_by: string;
          grades_data: Json;
          graduation_date: string;
          graduation_honors: string | null;
          id: string;
          student_data: Json;
          student_id: string;
        };
        Insert: {
          archived_at?: string;
          archived_by: string;
          grades_data: Json;
          graduation_date: string;
          graduation_honors?: string | null;
          id?: string;
          student_data: Json;
          student_id: string;
        };
        Update: {
          archived_at?: string;
          archived_by?: string;
          grades_data?: Json;
          graduation_date?: string;
          graduation_honors?: string | null;
          id?: string;
          student_data?: Json;
          student_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          ip_address: unknown | null;
          metadata: Json | null;
          new_values: Json | null;
          old_values: Json | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          new_values?: Json | null;
          old_values?: Json | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          new_values?: Json | null;
          old_values?: Json | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          email: string | null;
          first_name: string;
          is_active: boolean;
          is_approved: boolean;
          last_name: string;
          middle_name: string | null;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          email?: string | null;
          first_name: string;
          is_active?: boolean;
          is_approved?: boolean;
          last_name: string;
          middle_name?: string | null;
          role: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string;
          is_active?: boolean;
          is_approved?: boolean;
          last_name?: string;
          middle_name?: string | null;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      school_years: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          updated_at: string;
          year_code: string;
          year_end: string;
          year_start: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          year_code: string;
          year_end: string;
          year_start: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          year_code?: string;
          year_end?: string;
          year_start?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          created_at: string;
          description: string | null;
          grade_level: string;
          id: string;
          is_active: boolean;
          semester: string;
          strand: string | null;
          subject_code: string;
          subject_name: string;
          subject_type: string;
          track: string;
          units: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          grade_level: string;
          id?: string;
          is_active?: boolean;
          semester: string;
          strand?: string | null;
          subject_code: string;
          subject_name: string;
          subject_type: string;
          track: string;
          units?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          grade_level?: string;
          id?: string;
          is_active?: boolean;
          semester?: string;
          strand?: string | null;
          subject_code?: string;
          subject_name?: string;
          subject_type?: string;
          track?: string;
          units?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          description: string | null;
          id: string;
          setting_key: string;
          setting_value: string;
          updated_at: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          setting_key: string;
          setting_value: string;
          updated_at?: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          setting_key?: string;
          setting_value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teachers: {
        Row: {
          contact_number: string | null;
          created_at: string;
          department: string;
          employee_number: string;
          id: string;
          specialization: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          contact_number?: string | null;
          created_at?: string;
          department: string;
          employee_number: string;
          id?: string;
          specialization?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          contact_number?: string | null;
          created_at?: string;
          department?: string;
          employee_number?: string;
          id?: string;
          specialization?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
