import { createClient } from "@/lib/supabase/server";
import { server } from "@/lib/github";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberList } from "@/components/team/team-member-list";
import { Separator } from "@/components/ui/separator";

export default async function TeamPage({
  params,
}: {
  params: { orgName: string };
}) {
  const supabase = await createClient();
  const { orgName } = await params;

  // Get organization details
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, github_org_name")
    .eq("name", orgName)
    .single();

  if (!org) {
    return <div>Organization not found</div>;
  }

  // Get organization members
  const { data: orgMembers } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", org.id);

  // Get profiles for all members
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", orgMembers?.map((m) => m.user_id) || []);

  // Construct the members data structure
  const members = orgMembers?.map((member) => ({
    ...member,
    profile: profiles?.find((p) => p.id === member.user_id),
  }));

  // Get current user's role in the organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  const isOwner = membership?.role === "owner";

  return (
    <div className="container mx-auto py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted-foreground">
          Manage organization members and their access
        </p>
      </div>
      <Separator />
      <div className="py-6">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamMemberList
              members={members || []}
              organizationId={org.id}
              isOwner={isOwner}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
