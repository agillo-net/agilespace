import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createSpace, createSpaceMember } from "@/lib/supabase/mutations";
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
      // Create space (organization)
      await createSpace({
        name: org.login,
        slug: org.login.toLowerCase(),
        avatar_url: org.avatar_url,
        github_org_id: Number(org.id), // Fix: ensure number type
      });
      // Get the created space id (fetch by slug)
      const supabase = require("@/lib/supabase/client").getSupabaseClient();
      const { data: spaceData, error: spaceError } = await supabase
        .from("spaces")
        .select("id")
        .eq("slug", org.login.toLowerCase())
        .single();
      if (spaceError) throw new Error(spaceError.message);
      const space_id = spaceData.id;
      // Create space member for current user
      if (user && space_id) {
        await createSpaceMember({
          space_id,
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
