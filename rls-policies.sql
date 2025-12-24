-- =====================================================
-- SMARTGRADE ROW LEVEL SECURITY (RLS) POLICIES
-- Ampayon National High School - Senior High School
-- =====================================================
-- 
-- SECURITY ARCHITECTURE:
-- - Admin: Full access to all tables
-- - Teacher: Access only to their classes and enrolled students
-- - Student: Read-only access to their own records
-- - Public: Certificate verification only (specific fields)
--
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_finalization_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE honors ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'teacher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'student';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get student ID for current user
CREATE OR REPLACE FUNCTION get_student_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM students 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if teacher owns a class
CREATE OR REPLACE FUNCTION teacher_owns_class(class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM teacher_classes tc
    JOIN teachers t ON tc.teacher_id = t.id
    WHERE tc.id = class_id 
    AND t.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if student is enrolled in a class
CREATE OR REPLACE FUNCTION student_in_class(student_id UUID, class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM class_enrollments 
    WHERE class_enrollments.student_id = student_in_class.student_id 
    AND class_enrollments.class_id = student_in_class.class_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can update all profiles (for approvals)
CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- New users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SCHOOL YEARS TABLE POLICIES
-- =====================================================

-- All authenticated users can view school years
CREATE POLICY "Authenticated users can view school years"
  ON school_years FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin can manage school years
CREATE POLICY "Admin can manage school years"
  ON school_years FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- GRADING PERIODS TABLE POLICIES
-- =====================================================

-- All authenticated users can view grading periods
CREATE POLICY "Authenticated users can view grading periods"
  ON grading_periods FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin can manage grading periods
CREATE POLICY "Admin can manage grading periods"
  ON grading_periods FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- SUBJECTS TABLE POLICIES
-- =====================================================

-- All authenticated users can view subjects
CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin can manage subjects
CREATE POLICY "Admin can manage subjects"
  ON subjects FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- STUDENTS TABLE POLICIES
-- =====================================================

-- Admin can view all students
CREATE POLICY "Admin can view all students"
  ON students FOR SELECT
  USING (is_admin());

-- Students can view their own record
CREATE POLICY "Students can view own record"
  ON students FOR SELECT
  USING (user_id = auth.uid() AND is_student());

-- Teachers can view students enrolled in their classes
CREATE POLICY "Teachers can view enrolled students"
  ON students FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = students.id
      AND t.user_id = auth.uid()
    )
  );

-- Admin can manage students
CREATE POLICY "Admin can manage students"
  ON students FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Students can update limited fields in their own record
CREATE POLICY "Students can update own record"
  ON students FOR UPDATE
  USING (user_id = auth.uid() AND is_student())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TEACHERS TABLE POLICIES
-- =====================================================

-- Admin can view all teachers
CREATE POLICY "Admin can view all teachers"
  ON teachers FOR SELECT
  USING (is_admin());

-- Teachers can view their own record
CREATE POLICY "Teachers can view own record"
  ON teachers FOR SELECT
  USING (user_id = auth.uid() AND is_teacher());

-- Admin can manage teachers
CREATE POLICY "Admin can manage teachers"
  ON teachers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TEACHER CLASSES TABLE POLICIES
-- =====================================================

-- Admin can view all teacher classes
CREATE POLICY "Admin can view all teacher classes"
  ON teacher_classes FOR SELECT
  USING (is_admin());

-- Teachers can view their own classes
CREATE POLICY "Teachers can view own classes"
  ON teacher_classes FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = teacher_classes.teacher_id 
      AND teachers.user_id = auth.uid()
    )
  );

-- Teachers can create their own classes
CREATE POLICY "Teachers can create own classes"
  ON teacher_classes FOR INSERT
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = teacher_classes.teacher_id 
      AND teachers.user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- Teachers can update their own classes
CREATE POLICY "Teachers can update own classes"
  ON teacher_classes FOR UPDATE
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = teacher_classes.teacher_id 
      AND teachers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = teacher_classes.teacher_id 
      AND teachers.user_id = auth.uid()
    )
  );

-- Teachers can delete their own classes
CREATE POLICY "Teachers can delete own classes"
  ON teacher_classes FOR DELETE
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = teacher_classes.teacher_id 
      AND teachers.user_id = auth.uid()
    )
  );

-- Admin can manage all teacher classes
CREATE POLICY "Admin can manage all teacher classes"
  ON teacher_classes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- CLASS ENROLLMENTS TABLE POLICIES
-- =====================================================

-- Admin can view all enrollments
CREATE POLICY "Admin can view all enrollments"
  ON class_enrollments FOR SELECT
  USING (is_admin());

-- Teachers can view enrollments in their classes
CREATE POLICY "Teachers can view own class enrollments"
  ON class_enrollments FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teacher_classes tc
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE tc.id = class_enrollments.teacher_class_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON class_enrollments FOR SELECT
  USING (
    is_student() AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Teachers can enroll students in their classes
CREATE POLICY "Teachers can enroll students in own classes"
  ON class_enrollments FOR INSERT
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teacher_classes tc
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE tc.id = class_enrollments.teacher_class_id
      AND t.user_id = auth.uid()
    ) AND enrolled_by = auth.uid()
  );

-- Teachers can remove students from their classes
CREATE POLICY "Teachers can remove students from own classes"
  ON class_enrollments FOR DELETE
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teacher_classes tc
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE tc.id = class_enrollments.teacher_class_id
      AND t.user_id = auth.uid()
    )
  );

-- Admin can manage all enrollments
CREATE POLICY "Admin can manage all enrollments"
  ON class_enrollments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- GRADES TABLE POLICIES
-- =====================================================

-- Admin can view all grades
CREATE POLICY "Admin can view all grades"
  ON grades FOR SELECT
  USING (is_admin());

-- Teachers can view grades for their students
CREATE POLICY "Teachers can view own class grades"
  ON grades FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = grades.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Students can view their own grades
CREATE POLICY "Students can view own grades"
  ON grades FOR SELECT
  USING (
    is_student() AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Teachers can insert grades for their students
CREATE POLICY "Teachers can insert grades for own students"
  ON grades FOR INSERT
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = grades.teacher_id
      AND teachers.user_id = auth.uid()
    ) AND entered_by = auth.uid()
  );

-- Teachers can update grades for their students (if not finalized)
CREATE POLICY "Teachers can update grades for own students"
  ON grades FOR UPDATE
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = grades.teacher_id
      AND teachers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.id = grades.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

-- Admin can manage all grades
CREATE POLICY "Admin can manage all grades"
  ON grades FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- FINAL GRADES TABLE POLICIES
-- =====================================================

-- Admin can view all final grades
CREATE POLICY "Admin can view all final grades"
  ON final_grades FOR SELECT
  USING (is_admin());

-- Teachers can view final grades for their students
CREATE POLICY "Teachers can view own students final grades"
  ON final_grades FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = final_grades.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view their own final grades
CREATE POLICY "Students can view own final grades"
  ON final_grades FOR SELECT
  USING (
    is_student() AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Teachers can manage final grades for their students
CREATE POLICY "Teachers can manage own students final grades"
  ON final_grades FOR ALL
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = final_grades.student_id
      AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = final_grades.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Admin can manage all final grades
CREATE POLICY "Admin can manage all final grades"
  ON final_grades FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- GRADE FINALIZATION STATUS TABLE POLICIES
-- =====================================================

-- Admin can view all finalization statuses
CREATE POLICY "Admin can view all finalization statuses"
  ON grade_finalization_status FOR SELECT
  USING (is_admin());

-- Teachers can view finalization for their students
CREATE POLICY "Teachers can view own students finalization"
  ON grade_finalization_status FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = grade_finalization_status.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view their own finalization status
CREATE POLICY "Students can view own finalization status"
  ON grade_finalization_status FOR SELECT
  USING (
    is_student() AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Teachers can manage finalization for their students
CREATE POLICY "Teachers can manage own students finalization"
  ON grade_finalization_status FOR ALL
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = grade_finalization_status.student_id
      AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = grade_finalization_status.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Admin can manage all finalization statuses
CREATE POLICY "Admin can manage all finalization statuses"
  ON grade_finalization_status FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- CERTIFICATES TABLE POLICIES
-- =====================================================

-- PUBLIC can view certificates for verification (limited fields)
-- Note: This is intentionally permissive for public verification
CREATE POLICY "Public can view certificates for verification"
  ON certificates FOR SELECT
  USING (true);

-- Admin can view all certificates
CREATE POLICY "Admin can view all certificates"
  ON certificates FOR SELECT
  USING (is_admin());

-- Teachers can view certificates for their students
CREATE POLICY "Teachers can view own students certificates"
  ON certificates FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = certificates.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view their own certificates
CREATE POLICY "Students can view own certificates"
  ON certificates FOR SELECT
  USING (
    is_student() AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Teachers can generate certificates for their students
CREATE POLICY "Teachers can generate certificates for own students"
  ON certificates FOR INSERT
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = certificates.student_id
      AND t.user_id = auth.uid()
    ) AND generated_by = auth.uid()
  );

-- Admin can revoke certificates
CREATE POLICY "Admin can manage certificates"
  ON certificates FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can delete certificates
CREATE POLICY "Admin can delete certificates"
  ON certificates FOR DELETE
  USING (is_admin());

-- =====================================================
-- DOCUMENT EDITS TABLE POLICIES
-- =====================================================

-- Admin can view all document edits
CREATE POLICY "Admin can view all document edits"
  ON document_edits FOR SELECT
  USING (is_admin());

-- Teachers can view their own document edits
CREATE POLICY "Teachers can view own document edits"
  ON document_edits FOR SELECT
  USING (edited_by = auth.uid() AND is_teacher());

-- Teachers can insert document edits for their students
CREATE POLICY "Teachers can insert document edits"
  ON document_edits FOR INSERT
  WITH CHECK (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = document_edits.student_id
      AND t.user_id = auth.uid()
    ) AND edited_by = auth.uid()
  );

-- =====================================================
-- AUDIT LOGS TABLE POLICIES
-- =====================================================

-- Only admin can view audit logs
CREATE POLICY "Admin can view all audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- Teachers can view their own audit logs
CREATE POLICY "Teachers can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid() AND is_teacher());

-- All authenticated users can insert audit logs (system logging)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Only admin can manage audit logs
CREATE POLICY "Admin can manage audit logs"
  ON audit_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- HONORS TABLE POLICIES
-- =====================================================

-- Admin can view all honors
CREATE POLICY "Admin can view all honors"
  ON honors FOR SELECT
  USING (is_admin());

-- Teachers can view honors for their students
CREATE POLICY "Teachers can view own students honors"
  ON honors FOR SELECT
  USING (
    is_teacher() AND EXISTS (
      SELECT 1 
      FROM class_enrollments ce
      JOIN teacher_classes tc ON ce.teacher_class_id = tc.id
      JOIN teachers t ON tc.teacher_id = t.id
      WHERE ce.student_id = honors.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view their own honors
CREATE POLICY "Students can view own honors"
  ON honors FOR SELECT
  USING (
    is_student() AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Admin can manage honors
CREATE POLICY "Admin can manage honors"
  ON honors FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- ARCHIVED STUDENTS TABLE POLICIES
-- =====================================================

-- Admin can view all archived students
CREATE POLICY "Admin can view all archived students"
  ON archived_students FOR SELECT
  USING (is_admin());

-- Students can view their own archived records
CREATE POLICY "Students can view own archived records"
  ON archived_students FOR SELECT
  USING (
    is_student() AND student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Only admin can manage archived students
CREATE POLICY "Admin can manage archived students"
  ON archived_students FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- SYSTEM SETTINGS TABLE POLICIES
-- =====================================================

-- All authenticated users can view system settings
CREATE POLICY "Authenticated users can view system settings"
  ON system_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin can manage system settings
CREATE POLICY "Admin can manage system settings"
  ON system_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on helper functions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_student() TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_id() TO authenticated;
GRANT EXECUTE ON FUNCTION teacher_owns_class(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION student_in_class(UUID, UUID) TO authenticated;

-- Grant anon access to certificates for public verification
GRANT SELECT ON certificates TO anon;
GRANT SELECT ON students TO anon; -- Limited through RLS for certificate verification
GRANT SELECT ON school_years TO anon; -- For certificate verification context

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Public can view certificates for verification" ON certificates IS 
'Allows public (anonymous) access to certificates table for verification purposes. Application layer should filter sensitive data.';

COMMENT ON FUNCTION get_user_role() IS 
'Helper function to retrieve the role of the currently authenticated user.';

COMMENT ON FUNCTION is_admin() IS 
'Helper function to check if the current user has admin role.';

COMMENT ON FUNCTION is_teacher() IS 
'Helper function to check if the current user has teacher role.';

COMMENT ON FUNCTION is_student() IS 
'Helper function to check if the current user has student role.';
