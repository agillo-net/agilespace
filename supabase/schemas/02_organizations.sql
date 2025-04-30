-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  github_org_id TEXT UNIQUE,
  github_org_name TEXT,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Function to create a new organization
CREATE OR REPLACE FUNCTION create_organization(
  p_name TEXT,
  p_github_org_id TEXT,
  p_github_org_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_organization_id UUID;
  v_user_id UUID = auth.uid();
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, github_org_id, github_org_name, creator_id)
  VALUES (p_name, p_github_org_id, p_github_org_name, v_user_id)
  RETURNING id INTO v_organization_id;
  
  -- Add creator as owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_organization_id, v_user_id, 'owner');
  
  RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add member to organization
CREATE OR REPLACE FUNCTION add_organization_member(
  p_organization_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID = auth.uid();
  v_is_owner BOOLEAN;
BEGIN
  -- Check if the current user is an owner of the organization
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id 
    AND user_id = v_user_id 
    AND role = 'owner'
  ) INTO v_is_owner;
  
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Only organization owners can add members';
  END IF;
  
  -- Add the member
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, p_user_id, p_role);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage their organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Policies for organization members
CREATE POLICY "Users can view organization members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage organization members"
  ON organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );
