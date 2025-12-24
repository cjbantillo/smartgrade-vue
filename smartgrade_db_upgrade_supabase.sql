-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.archived_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  student_data jsonb NOT NULL,
  grades_data jsonb NOT NULL,
  graduation_date date NOT NULL,
  graduation_honors character varying,
  archived_by uuid NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT archived_students_pkey PRIMARY KEY (id),
  CONSTRAINT archived_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT archived_students_archived_by_fkey FOREIGN KEY (archived_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action character varying NOT NULL,
  entity_type character varying NOT NULL,
  entity_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  certificate_type character varying NOT NULL CHECK (certificate_type::text = ANY (ARRAY['honors'::character varying, 'good_moral'::character varying, 'completion'::character varying]::text[])),
  school_year_id uuid NOT NULL,
  issued_date date NOT NULL,
  pdf_url text,
  qr_code_url text,
  is_revoked boolean NOT NULL DEFAULT false,
  revoked_by uuid,
  revoked_at timestamp with time zone,
  revocation_reason text,
  generated_by uuid NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT certificates_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id),
  CONSTRAINT certificates_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.profiles(user_id),
  CONSTRAINT certificates_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.class_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  enrolled_by uuid NOT NULL,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  unenrolled_at timestamp with time zone,
  unenroll_reason text,
  CONSTRAINT class_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT class_enrollments_teacher_class_id_fkey FOREIGN KEY (teacher_class_id) REFERENCES public.teacher_classes(id),
  CONSTRAINT class_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT class_enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.document_edits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_type character varying NOT NULL CHECK (document_type::text = ANY (ARRAY['SF9'::character varying, 'SF10'::character varying]::text[])),
  student_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  field_name character varying NOT NULL,
  old_value text,
  new_value text,
  edited_by uuid NOT NULL,
  edited_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT document_edits_pkey PRIMARY KEY (id),
  CONSTRAINT document_edits_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT document_edits_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id),
  CONSTRAINT document_edits_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.document_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  document_type character varying NOT NULL CHECK (document_type::text = ANY (ARRAY['SF9'::character varying, 'SF10'::character varying]::text[])),
  school_year_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  CONSTRAINT document_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT document_metadata_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT document_metadata_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id),
  CONSTRAINT document_metadata_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.final_grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  semester character varying NOT NULL CHECK (semester::text = ANY (ARRAY['1'::character varying, '2'::character varying]::text[])),
  q1_grade numeric,
  q2_grade numeric,
  final_grade numeric CHECK (final_grade IS NULL OR final_grade >= 60::numeric AND final_grade <= 100::numeric),
  remarks character varying CHECK (remarks IS NULL OR (remarks::text = ANY (ARRAY['PASSED'::character varying, 'FAILED'::character varying, 'INC'::character varying, 'DROPPED'::character varying]::text[]))),
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT final_grades_pkey PRIMARY KEY (id),
  CONSTRAINT final_grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT final_grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT final_grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id)
);
CREATE TABLE public.grade_finalization_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  semester character varying NOT NULL CHECK (semester::text = ANY (ARRAY['1'::character varying, '2'::character varying]::text[])),
  is_finalized boolean NOT NULL DEFAULT false,
  general_average numeric,
  finalized_by uuid,
  finalized_at timestamp with time zone,
  unlock_count integer NOT NULL DEFAULT 0,
  last_unlocked_by uuid,
  last_unlocked_at timestamp with time zone,
  unlock_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT grade_finalization_status_pkey PRIMARY KEY (id),
  CONSTRAINT grade_finalization_status_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT grade_finalization_status_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id),
  CONSTRAINT grade_finalization_status_finalized_by_fkey FOREIGN KEY (finalized_by) REFERENCES public.profiles(user_id),
  CONSTRAINT grade_finalization_status_last_unlocked_by_fkey FOREIGN KEY (last_unlocked_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  grading_period_id uuid NOT NULL,
  written_work_score numeric,
  written_work_total numeric,
  performance_task_score numeric,
  performance_task_total numeric,
  quarterly_assessment_score numeric,
  quarterly_assessment_total numeric,
  quarterly_grade numeric CHECK (quarterly_grade IS NULL OR quarterly_grade >= 60::numeric AND quarterly_grade <= 100::numeric),
  remarks text,
  entered_by uuid NOT NULL,
  entered_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT grades_pkey PRIMARY KEY (id),
  CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT grades_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id),
  CONSTRAINT grades_grading_period_id_fkey FOREIGN KEY (grading_period_id) REFERENCES public.grading_periods(id),
  CONSTRAINT grades_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.grading_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL,
  period_name character varying NOT NULL,
  period_number smallint NOT NULL CHECK (period_number >= 1 AND period_number <= 4),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT grading_periods_pkey PRIMARY KEY (id),
  CONSTRAINT grading_periods_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id)
);
CREATE TABLE public.honors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  semester character varying NOT NULL CHECK (semester::text = ANY (ARRAY['1'::character varying, '2'::character varying]::text[])),
  honor_type character varying NOT NULL CHECK (honor_type::text = ANY (ARRAY['With Highest Honors'::character varying, 'With High Honors'::character varying, 'With Honors'::character varying]::text[])),
  general_average numeric NOT NULL CHECK (general_average >= 60::numeric AND general_average <= 100::numeric),
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT honors_pkey PRIMARY KEY (id),
  CONSTRAINT honors_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT honors_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  email character varying UNIQUE,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['admin'::character varying, 'teacher'::character varying, 'student'::character varying]::text[])),
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  middle_name character varying,
  is_active boolean NOT NULL DEFAULT true,
  is_approved boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.school_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year_code character varying NOT NULL UNIQUE,
  year_start date NOT NULL,
  year_end date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_years_pkey PRIMARY KEY (id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  student_number character varying NOT NULL UNIQUE,
  lrn character varying NOT NULL UNIQUE CHECK (lrn::text ~ '^\d{12}$'::text),
  grade_level character varying NOT NULL CHECK (grade_level::text = ANY (ARRAY['11'::character varying, '12'::character varying]::text[])),
  track character varying NOT NULL,
  strand character varying NOT NULL,
  section character varying NOT NULL,
  birth_date date NOT NULL,
  birth_place character varying,
  gender character varying NOT NULL CHECK (gender::text = ANY (ARRAY['Male'::character varying, 'Female'::character varying]::text[])),
  contact_number character varying,
  address text,
  guardian_name character varying,
  guardian_contact character varying,
  enrollment_date date NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_code character varying NOT NULL UNIQUE,
  subject_name character varying NOT NULL,
  grade_level character varying NOT NULL CHECK (grade_level::text = ANY (ARRAY['11'::character varying, '12'::character varying]::text[])),
  track character varying NOT NULL,
  strand character varying,
  semester character varying NOT NULL CHECK (semester::text = ANY (ARRAY['1'::character varying, '2'::character varying]::text[])),
  subject_type character varying NOT NULL CHECK (subject_type::text = ANY (ARRAY['Core'::character varying, 'Applied'::character varying, 'Specialized'::character varying]::text[])),
  units numeric NOT NULL DEFAULT 1.0,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key character varying NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.teacher_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  section character varying NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_classes_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT teacher_classes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT teacher_classes_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id),
  CONSTRAINT teacher_classes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  employee_number character varying NOT NULL UNIQUE,
  department character varying NOT NULL,
  specialization character varying,
  contact_number character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);