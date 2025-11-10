import { getUserOrgs } from "@/lib/github/queries";
import {
  createFileRoute,
  useLoaderData,
} from "@tanstack/react-router";
import { queryClient } from "@/main";
import { OrganizationsListSkeleton } from "@/components/skeleton/organizations-list-skeleton";
import { OrganizationCard } from "@/components/organization-card";
import { useSpaces } from "@/hooks/api/use-spaces";

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
  const loaderData = useLoaderData({ from: "/spaces" });
  const userOrgs = loaderData?.userOrgs || [];

  const {
    spacesWithMemberStatus,
    spacesWithMemberStatusLoading,
    navigateToSpace,
    createSpaceMutation,
    createSpaceMemberMutation,
    handleCreateSpace,
    handleJoinSpace,
  } = useSpaces();

  if (spacesWithMemberStatusLoading) {
    return <OrganizationsListSkeleton />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
      </div>

      {userOrgs && userOrgs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userOrgs.map((org) => {
            const space =
              spacesWithMemberStatus &&
              spacesWithMemberStatus.find((s) => s.github_org_id === org.id);

            return (
              <OrganizationCard
                key={org.login}
                org={org}
                space={space}
                navigateToSpace={navigateToSpace}
                handleCreateSpace={handleCreateSpace}
                handleJoinSpace={handleJoinSpace}
                createSpaceMutation={createSpaceMutation}
                createSpaceMemberMutation={createSpaceMemberMutation}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            No organizations found. Make sure you're logged in with GitHub and are a member of at least one organization.
          </p>
        </div>
      )}
    </div>
  );
}
