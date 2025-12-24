-- Migration: Create document_metadata table for SF9/SF10 editable fields
-- Date: 2025-12-24
-- Purpose: Store attendance records, observed values, and other metadata that teachers can edit

-- Create document_metadata table
CREATE TABLE IF NOT EXISTS public.document_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type varchar(10) NOT NULL CHECK (document_type IN ('SF9', 'SF10')),
  school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- Ensure one metadata record per student/document/school_year
  UNIQUE(student_id, document_type, school_year_id)
);

-- Create indexes for performance
CREATE INDEX idx_document_metadata_student ON public.document_metadata(student_id);
CREATE INDEX idx_document_metadata_type ON public.document_metadata(document_type);
CREATE INDEX idx_document_metadata_sy ON public.document_metadata(school_year_id);
CREATE INDEX idx_document_metadata_updated ON public.document_metadata(updated_at DESC);

-- Enable RLS
ALTER TABLE public.document_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can SELECT metadata for students in their classes
CREATE POLICY "Teachers can view metadata for their students"
ON public.document_metadata
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.teacher_classes tc ON ce.teacher_class_id = tc.id
    WHERE ce.student_id = document_metadata.student_id
      AND tc.teacher_id IN (
        SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
      )
  )
  OR is_admin()
);

-- RLS Policy: Teachers can INSERT metadata for students in their classes
CREATE POLICY "Teachers can create metadata for their students"
ON public.document_metadata
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.teacher_classes tc ON ce.teacher_class_id = tc.id
    WHERE ce.student_id = document_metadata.student_id
      AND tc.teacher_id IN (
        SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
      )
  )
  OR is_admin()
);

-- RLS Policy: Teachers can UPDATE metadata for students in their classes
CREATE POLICY "Teachers can update metadata for their students"
ON public.document_metadata
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.teacher_classes tc ON ce.teacher_class_id = tc.id
    WHERE ce.student_id = document_metadata.student_id
      AND tc.teacher_id IN (
        SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
      )
  )
  OR is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.teacher_classes tc ON ce.teacher_class_id = tc.id
    WHERE ce.student_id = document_metadata.student_id
      AND tc.teacher_id IN (
        SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
      )
  )
  OR is_admin()
);

-- RLS Policy: Students can SELECT their own metadata
CREATE POLICY "Students can view their own metadata"
ON public.document_metadata
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- RLS Policy: Admins can DELETE metadata
CREATE POLICY "Admins can delete metadata"
ON public.document_metadata
FOR DELETE
TO authenticated
USING (is_admin());

-- Add helpful comment
COMMENT ON TABLE public.document_metadata IS 'Stores editable metadata for SF9/SF10 documents (attendance, observed values, etc.)';
COMMENT ON COLUMN public.document_metadata.data IS 'JSONB field storing attendance records, observed values, and other form data';

-- Sample data structure for reference:
-- SF9 metadata.data example:
-- {
--   "attendance": [
--     {"month": "June", "school_days": 20, "days_present": 20, "days_absent": 0},
--     ...
--   ],
--   "values": {
--     "makadiyos_1_sem1": "AO",
--     "makadiyos_2_sem1": "SO",
--     ...
--   }
-- }

-- SF10 metadata.data example:
-- {
--   "eligibility": "JHS_COMPLETER",
--   "principal_name": "Dr. Juan Dela Cruz",
--   "school_address": "Ampayon, Butuan City"
-- }
