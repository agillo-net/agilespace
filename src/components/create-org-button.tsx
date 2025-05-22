import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  createOrganization,
  createOrganizationMember,
} from "@/lib/supabase/mutations";
import { useAuth } from "@/hooks/use-auth";

interface CreateOrgButtonProps {
  org: {
    id: string;
    login: string;
    avatar_url: string;
  };
  onSuccess?: () => void;
}

export function CreateOrgButton({ org, onSuccess }: CreateOrgButtonProps) {
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async () => {
      // Create organization
      await createOrganization({
        name: org.login,
        slug: org.login.toLowerCase(),
        avatar_url: org.avatar_url,
        github_org_id: org.id,
      });
      // Get the created org id (fetch by slug)
      const supabase = require("@/lib/supabase/client").getSupabaseClient();
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", org.login.toLowerCase())
        .single();
      if (orgError) throw new Error(orgError.message);
      const organization_id = orgData.id;
      // Create organization member for current user
      if (user && organization_id) {
        await createOrganizationMember({
          organization_id,
          user_id: user.id,
          role: "admin",
        });
      }
    },
    onSuccess,
  });

  return (
    <Button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      variant="secondary"
    >
      {mutation.isPending ? "Creating..." : "Create"}
    </Button>
  );
}
