-- Migration: Create teacher_invites table for pre-registration workflow
-- Purpose: Allow Admin to pre-register teachers before they sign up
-- When a teacher signs up with a matching email, auto-populate their profile

CREATE TABLE IF NOT EXISTS public.teacher_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  employee_number TEXT,
  department TEXT,
  specialization TEXT,
  contact_number TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT email_deped_only CHECK (email ~* '^[a-zA-Z0-9._%+-]+@deped\.gov\.ph$')
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_teacher_invites_email ON public.teacher_invites(email);
CREATE INDEX IF NOT EXISTS idx_teacher_invites_status ON public.teacher_invites(status);

-- RLS Policies for teacher_invites
ALTER TABLE public.teacher_invites ENABLE ROW LEVEL SECURITY;

-- Admin can view all invites
CREATE POLICY "Admin can view all teacher invites"
  ON public.teacher_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert invites
CREATE POLICY "Admin can create teacher invites"
  ON public.teacher_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update invites
CREATE POLICY "Admin can update teacher invites"
  ON public.teacher_invites
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete invites
CREATE POLICY "Admin can delete teacher invites"
  ON public.teacher_invites
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger function to auto-accept invite when teacher signs up
CREATE OR REPLACE FUNCTION public.auto_accept_teacher_invite()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Look for matching invite
  SELECT * INTO invite_record
  FROM public.teacher_invites
  WHERE email = NEW.email
  AND status = 'pending'
  AND expires_at > NOW()
  LIMIT 1;

  -- If invite exists, populate teacher data
  IF FOUND THEN
    -- Update profile with invite data
    UPDATE public.profiles
    SET
      first_name = COALESCE(NEW.first_name, invite_record.first_name),
      last_name = COALESCE(NEW.last_name, invite_record.last_name),
      middle_name = COALESCE(NEW.middle_name, invite_record.middle_name),
      is_approved = true,  -- Auto-approve pre-registered teachers
      approved_at = NOW(),
      approved_by = invite_record.invited_by
    WHERE user_id = NEW.user_id;

    -- Create teacher record
    INSERT INTO public.teachers (
      user_id,
      employee_number,
      department,
      specialization,
      contact_number
    ) VALUES (
      NEW.user_id,
      invite_record.employee_number,
      invite_record.department,
      invite_record.specialization,
      invite_record.contact_number
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      employee_number = EXCLUDED.employee_number,
      department = EXCLUDED.department,
      specialization = EXCLUDED.specialization,
      contact_number = EXCLUDED.contact_number;

    -- Mark invite as accepted
    UPDATE public.teacher_invites
    SET
      status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
    WHERE id = invite_record.id;

    -- Log to audit
    INSERT INTO public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      NEW.user_id,
      'teacher_invite_accepted',
      'TeacherInvite',
      invite_record.id::TEXT,
      jsonb_build_object(
        'email', invite_record.email,
        'employee_number', invite_record.employee_number
      ),
      'system',
      'Auto-registration'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS trigger_auto_accept_teacher_invite ON public.profiles;
CREATE TRIGGER trigger_auto_accept_teacher_invite
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'teacher')
  EXECUTE FUNCTION public.auto_accept_teacher_invite();

-- Function to expire old invites (run periodically)
CREATE OR REPLACE FUNCTION public.expire_old_teacher_invites()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.teacher_invites
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
  AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.teacher_invites IS 'Pre-registration invites for teachers. Auto-accepted when teacher signs up with matching email.';
COMMENT ON FUNCTION public.auto_accept_teacher_invite() IS 'Trigger function to auto-populate teacher data from invite when they sign up.';
COMMENT ON FUNCTION public.expire_old_teacher_invites() IS 'Utility function to expire invites older than 30 days.';
