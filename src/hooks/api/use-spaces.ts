import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getSpacesWithMembershipStatus } from "@/lib/supabase/queries";
import { createSpace, createSpaceMember } from "@/lib/supabase/mutations";
import { generatePath } from "@/lib/routes";
import { queryKeys } from "@/lib/query-keys";
import type { SpaceWithMembership } from "@/types";
import type { Endpoints } from "@octokit/types";

type Org = Endpoints["GET /user/orgs"]["response"]["data"][number];

export function useSpaces() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: spacesWithMemberStatus,
    isLoading: spacesWithMemberStatusLoading,
  } = useQuery({
    queryKey: queryKeys.spaces.withMembership(),
    queryFn: getSpacesWithMembershipStatus,
  });

  const navigateToSpace = (
    orgLogin: string,
    space: SpaceWithMembership | undefined
  ) => {
    if (space) {
      navigate({ to: generatePath.space(orgLogin) });
    }
  };

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (_, org) => {
      toast.success(`Space ${org.name} created successfully`);
    },
    onError: (error: Error, org) => {
      toast.error(`Failed to create space ${org.name}: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.withMembership(),
      });
    },
  });

  const createSpaceMemberMutation = useMutation({
    mutationFn: createSpaceMember,
    onSuccess: () => {
      toast.success(`Joined space successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to join space: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.withMembership(),
      });
    },
  });

  const handleCreateSpace = (e: React.MouseEvent, org: Org) => {
    e.stopPropagation();
    createSpaceMutation.mutate({
      avatar_url: org.avatar_url,
      name: org.login,
      slug: org.login,
      github_org_id: org.id,
    });
  };

  const handleJoinSpace = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    createSpaceMemberMutation.mutate({
      space_id: spaceId,
      role: "member",
    });
  };

  return {
    spacesWithMemberStatus,
    spacesWithMemberStatusLoading,
    navigateToSpace,
    createSpaceMutation,
    createSpaceMemberMutation,
    handleCreateSpace,
    handleJoinSpace,
  };
}
