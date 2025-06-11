import { getUserOrgs } from "@/lib/github/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { queryClient } from "@/main";
import { getSpacesWithMembershipStatus } from "@/lib/supabase/queries";
import { createSpace, createSpaceMember } from "@/lib/supabase/mutations";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { generatePath } from "@/lib/routes";
import type { SpaceWithMembership } from "@/lib/supabase/queries.type";
import { ButtonWithLoading } from "@/components/button-with-loading";
import { OrganizationsListSkeleton } from "@/components/skeleton/OrganizationsList";

export const Route = createFileRoute("/spaces")({
  loader: async () => {
    const userOrgs = await queryClient.ensureQueryData({
      queryKey: ["getUserOrgs"],
      queryFn: getUserOrgs,
    });

    return {
      userOrgs,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const { userOrgs } = useLoaderData({ from: "/spaces" });

  // We use a query to fetch spaces with membership status 
  // This will automatically refetch when the component mounts
  // We set this here not in the loader because if it's in the loader, it won't refetch when the component mounts
  // and we want to ensure we have the latest data
  // and also to handle the loading state properly
  // This query will be used to display the spaces and their membership status
  const { data: spacesWithMemberStatus, isLoading: spacesWithMemberStatusLoading } = useQuery({
    queryKey: ["getSpacesWithMembershipStatus"],
    queryFn: getSpacesWithMembershipStatus,
  });


  const navigateToSpace = (orgLogin: string, space: SpaceWithMembership | undefined) => {
    if (space) {
      navigate({ to: generatePath.space(orgLogin) });
    }
  };

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onMutate: async (org) => {
      setLoadingStates((prev) => ({ ...prev, [org.github_org_id]: true }));
    },
    onSuccess: (_, org) => {
      toast.success(`Space ${org.name} created successfully`);
    },
    onError: (error: Error, org) => {
      toast.error(`Failed to create space ${org.name}: ${error.message}`);
    },
    onSettled: (_, _1, org) => {
      setLoadingStates((prev) => ({ ...prev, [org.github_org_id]: false }));
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["getSpacesWithMembershipStatus"] });
    },
  });

  const createSpaceMemberMutation = useMutation({
    mutationFn: createSpaceMember,
    onMutate: async (data) => {
      setLoadingStates((prev) => ({ ...prev, [data.space_id]: true }));
    },
    onSuccess: () => {
      toast.success(`Joined space successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to join space: ${error.message}`);
    },
    onSettled: (_, _1, data) => {
      setLoadingStates((prev) => ({ ...prev, [data.space_id]: false }));
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["getSpacesWithMembershipStatus"] });
    },
  });

  if (spacesWithMemberStatusLoading) {
    return <OrganizationsListSkeleton />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
      </div>

      {userOrgs.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userOrgs.map((org) => {
            const space = spacesWithMemberStatus && spacesWithMemberStatus.find(
              (s) => s.github_org_id === org.id
            );

            return (
              <Card
                key={org.login}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigateToSpace(org.login, space)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {org.avatar_url && (
                      <img
                        src={org.avatar_url}
                        alt={org.login}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <CardTitle>{org.login}</CardTitle>
                  </div>
                  {org.description && (
                    <CardDescription className="mt-2">
                      {org.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on GitHub
                  </a>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2">
                  <ButtonWithLoading
                    onClick={(e) => {
                      e.stopPropagation();
                      createSpaceMutation.mutate({
                        avatar_url: org.avatar_url,
                        name: org.login,
                        slug: org.login,
                        github_org_id: org.id,
                      });
                    }}
                    loading={loadingStates[org.id]}
                    disabled={!!space || loadingStates[org.id]}
                  >
                    {loadingStates[org.id] ? "Creating..." : space ? "Created" : "Create Space"}
                  </ButtonWithLoading>
                  <ButtonWithLoading
                    onClick={(e) => {
                      e.stopPropagation();
                      createSpaceMemberMutation.mutate({
                        space_id: space?.id || "",
                        role: "member",
                      });
                    }}
                    loading={loadingStates[space?.id || ""]}
                    disabled={space?.is_member || loadingStates[space?.id || ""] || !space?.id}
                  >
                    {loadingStates[space?.id || ""]
                      ? "Joining..."
                      : space?.is_member
                        ? `Joined (${space.member_role})`
                        : "Join Space"}
                  </ButtonWithLoading>
                  <ButtonWithLoading
                    onClick={() => {
                      navigateToSpace(org.login, space);
                    }}
                    disabled={!space?.is_member}
                  >
                    View
                  </ButtonWithLoading>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            No organizations found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
