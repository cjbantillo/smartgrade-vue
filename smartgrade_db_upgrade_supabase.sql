-- =====================================================
-- SmartGrade Database Schema for Supabase
-- Automated Grading System for Ampayon National High School - Senior High School
-- Modern Stack: Vue 3 + TypeScript + Vuetify + Supabase
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES TABLE
-- Links to Supabase Auth and stores role information
-- Email must be @deped.gov.ph domain only
-- =====================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'teacher', 'student')),
  CONSTRAINT valid_email_domain CHECK (email LIKE '%@deped.gov.ph')
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- =====================================================
-- SCHOOL YEARS TABLE
-- Academic year management
-- =====================================================
CREATE TABLE school_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_code VARCHAR(20) NOT NULL UNIQUE,
  year_start DATE NOT NULL,
  year_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_school_years_is_active ON school_years(is_active);
CREATE INDEX idx_school_years_year_code ON school_years(year_code);

-- =====================================================
-- GRADING PERIODS TABLE
-- Quarterly periods within school years
-- =====================================================
CREATE TABLE grading_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  period_name VARCHAR(50) NOT NULL,
  period_number SMALLINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_period_number CHECK (period_number BETWEEN 1 AND 4)
);

CREATE INDEX idx_grading_periods_school_year ON grading_periods(school_year_id);
CREATE INDEX idx_grading_periods_is_active ON grading_periods(is_active);

-- =====================================================
-- STUDENTS TABLE
-- Student information for DepEd SF9/SF10 compliance
-- =====================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_number VARCHAR(20) NOT NULL UNIQUE,
  lrn VARCHAR(12) NOT NULL UNIQUE,
  grade_level VARCHAR(2) NOT NULL,
  track VARCHAR(50) NOT NULL,
  strand VARCHAR(50) NOT NULL,
  section VARCHAR(20) NOT NULL,
  birth_date DATE NOT NULL,
  birth_place VARCHAR(100),
  gender VARCHAR(10) NOT NULL,
  contact_number VARCHAR(15),
  address TEXT,
  guardian_name VARCHAR(100),
  guardian_contact VARCHAR(15),
  enrollment_date DATE NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_grade_level CHECK (grade_level IN ('11', '12')),
  CONSTRAINT valid_gender CHECK (gender IN ('Male', 'Female')),
  CONSTRAINT valid_lrn_format CHECK (lrn ~ '^\d{12}$')
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_lrn ON students(lrn);
CREATE INDEX idx_students_grade_level ON students(grade_level);
CREATE INDEX idx_students_track_strand ON students(track, strand);
CREATE INDEX idx_students_is_archived ON students(is_archived);

-- =====================================================
-- TEACHERS TABLE
-- Teacher employment information
-- =====================================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  employee_number VARCHAR(20) NOT NULL UNIQUE,
  department VARCHAR(50) NOT NULL,
  specialization VARCHAR(100),
  contact_number VARCHAR(15),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_employee_number ON teachers(employee_number);

-- =====================================================
-- SUBJECTS TABLE
-- Senior High School subject catalog
-- =====================================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code VARCHAR(20) NOT NULL UNIQUE,
  subject_name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(2) NOT NULL,
  track VARCHAR(50) NOT NULL,
  strand VARCHAR(50),
  semester VARCHAR(1) NOT NULL,
  subject_type VARCHAR(20) NOT NULL,
  units DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_grade_level CHECK (grade_level IN ('11', '12')),
  CONSTRAINT valid_semester CHECK (semester IN ('1', '2')),
  CONSTRAINT valid_subject_type CHECK (subject_type IN ('Core', 'Applied', 'Specialized'))
);

CREATE INDEX idx_subjects_subject_code ON subjects(subject_code);
CREATE INDEX idx_subjects_grade_level ON subjects(grade_level);
CREATE INDEX idx_subjects_track_strand ON subjects(track, strand);
CREATE INDEX idx_subjects_is_active ON subjects(is_active);

-- =====================================================
-- TEACHER CLASSES TABLE
-- Teacher-created class sections (replaces admin-driven class_assignments)
-- =====================================================
CREATE TABLE teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  section VARCHAR(20) NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_teacher_class UNIQUE(teacher_id, subject_id, school_year_id, section)
);

CREATE INDEX idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX idx_teacher_classes_subject ON teacher_classes(subject_id);
CREATE INDEX idx_teacher_classes_school_year ON teacher_classes(school_year_id);

-- =====================================================
-- CLASS ENROLLMENTS TABLE
-- Teacher-driven student enrollment into classes
-- =====================================================
CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_class_id UUID NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_by UUID NOT NULL REFERENCES profiles(user_id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  unenrolled_at TIMESTAMPTZ,
  unenroll_reason TEXT,
  CONSTRAINT unique_class_enrollment UNIQUE(teacher_class_id, student_id)
);

CREATE INDEX idx_class_enrollments_teacher_class ON class_enrollments(teacher_class_id);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_is_active ON class_enrollments(is_active);

-- =====================================================
-- GRADES TABLE
-- Individual quarterly grade records with DepEd components
-- Written Work (30%), Performance Tasks (50%), Quarterly Assessment (20%)
-- =====================================================
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  grading_period_id UUID NOT NULL REFERENCES grading_periods(id) ON DELETE CASCADE,
  written_work_score DECIMAL(5,2),
  written_work_total DECIMAL(5,2),
  performance_task_score DECIMAL(5,2),
  performance_task_total DECIMAL(5,2),
  quarterly_assessment_score DECIMAL(5,2),
  quarterly_assessment_total DECIMAL(5,2),
  quarterly_grade DECIMAL(5,2),
  remarks TEXT,
  entered_by UUID NOT NULL REFERENCES profiles(user_id),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_grade_entry UNIQUE(student_id, subject_id, grading_period_id),
  CONSTRAINT valid_quarterly_grade CHECK (quarterly_grade IS NULL OR (quarterly_grade >= 60 AND quarterly_grade <= 100))
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject_id);
CREATE INDEX idx_grades_teacher ON grades(teacher_id);
CREATE INDEX idx_grades_school_year ON grades(school_year_id);
CREATE INDEX idx_grades_grading_period ON grades(grading_period_id);

-- =====================================================
-- FINAL GRADES TABLE
-- Computed semester/year-end grades
-- =====================================================
CREATE TABLE final_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  semester VARCHAR(1) NOT NULL,
  q1_grade DECIMAL(5,2),
  q2_grade DECIMAL(5,2),
  final_grade DECIMAL(5,2),
  remarks VARCHAR(20),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_final_grade UNIQUE(student_id, subject_id, school_year_id, semester),
  CONSTRAINT valid_semester CHECK (semester IN ('1', '2')),
  CONSTRAINT valid_final_grade CHECK (final_grade IS NULL OR (final_grade >= 60 AND final_grade <= 100)),
  CONSTRAINT valid_remarks CHECK (remarks IS NULL OR remarks IN ('PASSED', 'FAILED', 'INC', 'DROPPED'))
);

CREATE INDEX idx_final_grades_student ON final_grades(student_id);
CREATE INDEX idx_final_grades_subject ON final_grades(subject_id);
CREATE INDEX idx_final_grades_school_year ON final_grades(school_year_id);
CREATE INDEX idx_final_grades_semester ON final_grades(semester);

-- =====================================================
-- GRADE FINALIZATION STATUS TABLE
-- Tracks grade finalization and unlock states
-- =====================================================
CREATE TABLE grade_finalization_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  semester VARCHAR(1) NOT NULL,
  is_finalized BOOLEAN NOT NULL DEFAULT false,
  general_average DECIMAL(5,2),
  finalized_by UUID REFERENCES profiles(user_id),
  finalized_at TIMESTAMPTZ,
  unlock_count INTEGER NOT NULL DEFAULT 0,
  last_unlocked_by UUID REFERENCES profiles(user_id),
  last_unlocked_at TIMESTAMPTZ,
  unlock_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_finalization_status UNIQUE(student_id, school_year_id, semester),
  CONSTRAINT valid_semester CHECK (semester IN ('1', '2'))
);

CREATE INDEX idx_finalization_student ON grade_finalization_status(student_id);
CREATE INDEX idx_finalization_school_year ON grade_finalization_status(school_year_id);
CREATE INDEX idx_finalization_is_finalized ON grade_finalization_status(is_finalized);

-- =====================================================
-- HONORS TABLE
-- Academic distinction tracking
-- =====================================================
CREATE TABLE honors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  semester VARCHAR(1) NOT NULL,
  honor_type VARCHAR(50) NOT NULL,
  general_average DECIMAL(5,2) NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_honor UNIQUE(student_id, school_year_id, semester),
  CONSTRAINT valid_semester CHECK (semester IN ('1', '2')),
  CONSTRAINT valid_honor_type CHECK (honor_type IN ('With Highest Honors', 'With High Honors', 'With Honors')),
  CONSTRAINT valid_general_average CHECK (general_average >= 60 AND general_average <= 100)
);

CREATE INDEX idx_honors_student ON honors(student_id);
CREATE INDEX idx_honors_school_year ON honors(school_year_id);
CREATE INDEX idx_honors_honor_type ON honors(honor_type);

-- =====================================================
-- CERTIFICATES TABLE
-- Generated certificates with QR verification support
-- =====================================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  certificate_type VARCHAR(50) NOT NULL,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  issued_date DATE NOT NULL,
  pdf_url TEXT,
  qr_code_url TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_by UUID REFERENCES profiles(user_id),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  generated_by UUID NOT NULL REFERENCES profiles(user_id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_certificate_type CHECK (certificate_type IN ('honors', 'good_moral', 'completion'))
);

CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_school_year ON certificates(school_year_id);
CREATE INDEX idx_certificates_type ON certificates(certificate_type);
CREATE INDEX idx_certificates_is_revoked ON certificates(is_revoked);

-- =====================================================
-- DOCUMENT EDITS TABLE
-- Tracks SF9/SF10 metadata edits (non-grade fields)
-- =====================================================
CREATE TABLE document_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(10) NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  edited_by UUID NOT NULL REFERENCES profiles(user_id),
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_document_type CHECK (document_type IN ('SF9', 'SF10'))
);

CREATE INDEX idx_document_edits_student ON document_edits(student_id);
CREATE INDEX idx_document_edits_document_type ON document_edits(document_type);
CREATE INDEX idx_document_edits_edited_at ON document_edits(edited_at);

-- =====================================================
-- AUDIT LOGS TABLE
-- Comprehensive system activity logging
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- ARCHIVED STUDENTS TABLE
-- Graduated student record snapshots
-- =====================================================
CREATE TABLE archived_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_data JSONB NOT NULL,
  grades_data JSONB NOT NULL,
  graduation_date DATE NOT NULL,
  graduation_honors VARCHAR(50),
  archived_by UUID NOT NULL REFERENCES profiles(user_id),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_archived_students_student ON archived_students(student_id);
CREATE INDEX idx_archived_students_graduation_date ON archived_students(graduation_date);

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- Configurable system parameters
-- =====================================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
