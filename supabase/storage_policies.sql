-- =====================================================
-- SUPABASE STORAGE BUCKETS AND POLICIES
-- SmartGrade System - Ampayon National High School
-- =====================================================
-- 
-- PURPOSE:
-- - Create storage buckets for certificates and documents
-- - Set up public access for QR code verification
-- - Configure RLS policies for authenticated uploads
--
-- BUCKETS:
-- - certificates: PDF certificates (honors, good moral, completion)
-- - documents: SF9/SF10 forms
--
-- NOTE: This script creates BUCKETS only.
-- Storage POLICIES must be created via Supabase Dashboard due to permission requirements.
-- See instructions at the end of this file.
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Create certificates bucket (public for QR verification)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true, -- Public access required for QR verification
  5242880, -- 5MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create documents bucket (public for student access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true, -- Public access for SF9/SF10 downloads
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFY BUCKETS CREATED
-- =====================================================

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('certificates', 'documents');

-- =====================================================
-- STORAGE POLICIES - MANUAL SETUP REQUIRED
-- =====================================================
-- 
-- Due to permission restrictions, storage policies CANNOT be created via SQL.
-- You must create them manually in the Supabase Dashboard.
--
-- GO TO: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/policies
--
-- =====================================================

/*
POLICY 1: certificates - INSERT (Authenticated users can upload)
---------------------------------------------------------------
Bucket: certificates
Operation: INSERT
Target roles: authenticated
Policy definition:
  (bucket_id = 'certificates'::text)

---------------------------------------------------------------

POLICY 2: certificates - SELECT (Public can read for verification)
---------------------------------------------------------------
Bucket: certificates
Operation: SELECT
Target roles: public
Policy definition:
  (bucket_id = 'certificates'::text)

---------------------------------------------------------------

POLICY 3: certificates - UPDATE (Authenticated users can update)
---------------------------------------------------------------
Bucket: certificates
Operation: UPDATE
Target roles: authenticated
USING expression:
  (bucket_id = 'certificates'::text)
WITH CHECK expression:
  (bucket_id = 'certificates'::text)

---------------------------------------------------------------

POLICY 4: certificates - DELETE (Admins only)
---------------------------------------------------------------
Bucket: certificates
Operation: DELETE
Target roles: authenticated
Policy definition:
  ((bucket_id = 'certificates'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))))

---------------------------------------------------------------

POLICY 5: documents - INSERT (Authenticated users can upload)
---------------------------------------------------------------
Bucket: documents
Operation: INSERT
Target roles: authenticated
Policy definition:
  (bucket_id = 'documents'::text)

---------------------------------------------------------------

POLICY 6: documents - SELECT (Public can read)
---------------------------------------------------------------
Bucket: documents
Operation: SELECT
Target roles: public
Policy definition:
  (bucket_id = 'documents'::text)

---------------------------------------------------------------

POLICY 7: documents - UPDATE (Authenticated users can update)
---------------------------------------------------------------
Bucket: documents
Operation: UPDATE
Target roles: authenticated
USING expression:
  (bucket_id = 'documents'::text)
WITH CHECK expression:
  (bucket_id = 'documents'::text)

---------------------------------------------------------------

POLICY 8: documents - DELETE (Admins only)
---------------------------------------------------------------
Bucket: documents
Operation: DELETE
Target roles: authenticated
Policy definition:
  ((bucket_id = 'documents'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))))

*/

-- =====================================================
-- QUICK SETUP GUIDE
-- =====================================================
--
-- 1. Run THIS SQL file to create buckets (already done if no errors)
-- 2. Go to Supabase Dashboard > Storage > Policies
-- 3. For 'certificates' bucket, click "New Policy"
-- 4. Create 4 policies:
--    - INSERT for authenticated
--    - SELECT for public
--    - UPDATE for authenticated  
--    - DELETE for authenticated (with admin check)
-- 5. Repeat for 'documents' bucket
--
-- OR use the policy templates in the comments above
-- =====================================================
