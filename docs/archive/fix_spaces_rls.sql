-- =====================================================
-- FIX SPACES RLS POLICY
-- =====================================================
-- This ensures the spaces table has the correct RLS policies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can create spaces" ON spaces;
DROP POLICY IF EXISTS "Space members can view spaces" ON spaces;
DROP POLICY IF EXISTS "Space admins can update spaces" ON spaces;
DROP POLICY IF EXISTS "Space admins can delete spaces" ON spaces;

-- Ensure RLS is enabled
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Recreate policies

-- Space members can view their spaces
CREATE POLICY "Space members can view spaces"
  ON spaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = spaces.id
        AND space_members.user_id = auth.uid()
    )
  );

-- Space admins can update spaces (requires space:update permission)
CREATE POLICY "Space admins can update spaces"
  ON spaces FOR UPDATE
  TO authenticated
  USING (
    user_has_permission(auth.uid(), id, 'space:update')
  );

-- Space admins can delete spaces (requires space:delete permission)
CREATE POLICY "Space admins can delete spaces"
  ON spaces FOR DELETE
  TO authenticated
  USING (
    user_has_permission(auth.uid(), id, 'space:delete')
  );

-- Authenticated users can create spaces
-- Note: In practice, use create_space_with_admin() function instead
CREATE POLICY "Authenticated users can create spaces"
  ON spaces FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- VERIFY create_space_with_admin FUNCTION EXISTS
-- =====================================================

-- Recreate the function if needed
CREATE OR REPLACE FUNCTION create_space_with_admin(
  p_name text,
  p_slug text,
  p_avatar_url text DEFAULT NULL,
  p_github_org_id bigint DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_space_id uuid;
BEGIN
  -- Create the space
  INSERT INTO spaces (name, slug, avatar_url, github_org_id)
  VALUES (p_name, p_slug, p_avatar_url, p_github_org_id)
  RETURNING id INTO v_space_id;

  -- Add the creator as admin
  INSERT INTO space_members (space_id, user_id, role)
  VALUES (v_space_id, auth.uid(), 'admin');

  RETURN v_space_id;
END;
$$;

COMMENT ON FUNCTION create_space_with_admin IS 'Create a new space and automatically add the creator as admin (bypasses RLS using SECURITY DEFINER)';

-- =====================================================
-- TEST THE SETUP
-- =====================================================

-- Verify policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'spaces'
ORDER BY policyname;

-- Verify function exists
SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'create_space_with_admin';

-- =====================================================
-- DONE
-- =====================================================
-- After running this, your space creation should work!
