import { getSupabaseClient } from "@/lib/supabase/client";
import { getOrganizationByGithubId, getOrganizationAndMemberStatus } from "./queries";

export async function createProfile({
  id,
  full_name,
  github_username,
}: {
  id: string;
  full_name: string;
  github_username: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("profiles").insert({
    id,
    full_name,
    github_username,
  });
  if (error) throw new Error(error.message);
}

export async function createOrganization({
  name,
  slug,
  avatar_url,
  github_org_id,
}: {
  name: string;
  slug: string;
  avatar_url: string;
  github_org_id: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("organizations").insert({
    name,
    slug,
    avatar_url,
    github_org_id,
  });
  if (error) throw new Error(error.message);
}

export async function createOrganizationMember({
  organization_id,
  user_id,
  role = "admin",
}: {
  organization_id: string;
  user_id: string;
  role?: "admin" | "member" | "observer";
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("organization_members").insert({
    organization_id,
    user_id,
    role,
  });
  if (error) throw new Error(error.message);
}


export async function createOrganizationWithMember({
  name,
  slug,
  avatar_url,
  github_org_id,
  user_id,
}: {
  name: string;
  slug: string;
  avatar_url: string;
  github_org_id: string;
  user_id: string;
}) {
  const supabase = getSupabaseClient();

  // First check if organization exists
  const existingOrg = await getOrganizationByGithubId(github_org_id);
  if (existingOrg) {
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", existingOrg.id)
      .eq("user_id", user_id)
      .single();

    if (!existingMember) {
      // Add user as member if not already a member
      await createOrganizationMember({
        organization_id: existingOrg.id,
        user_id,
        role: "admin",
      });
    }
    return existingOrg;
  }

  // Create new organization
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      avatar_url,
      github_org_id,
    })
    .select()
    .single();

  if (orgError) throw new Error(orgError.message);

  // Add user as member
  await createOrganizationMember({
    organization_id: newOrg.id,
    user_id,
    role: "admin",
  });

  return newOrg;
}

export async function createOrgMutation(org: any, userId: string) {
  if (!userId) throw new Error('User not available');
  return await createOrganizationWithMember({
    name: org.login,
    slug: org.login.toLowerCase(),
    avatar_url: org.avatar_url,
    github_org_id: org.id.toString(),
    user_id: userId,
  });
}

export async function joinOrgMutation(org: any, userId: string) {
  if (!userId) throw new Error('User not available');
  const existingOrg = await getOrganizationAndMemberStatus(org.id.toString(), userId);
  if (!existingOrg.exists) {
    throw new Error(`Organization ${org.login} doesn't exist yet. Create it first.`);
  }
  return await createOrganizationWithMember({
    name: org.login,
    slug: org.login.toLowerCase(),
    avatar_url: org.avatar_url,
    github_org_id: org.id.toString(),
    user_id: userId,
  });
}

export async function loginWithGitHubMutation(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo,read:user,user:email,read:org",
    },
  });
  if (error) throw error;
}

export async function logoutMutation(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}
