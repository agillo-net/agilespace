import { getUserOrgs } from "@/lib/github/queries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { queryClient } from "@/main";
import { getUserSpaces } from "@/lib/supabase/queries";
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
import { Button } from "react-day-picker";

export const Route = createFileRoute("/spaces")({
  loader: async () => {
    const userOrgs = await queryClient.ensureQueryData({
      queryKey: ["getUserOrgs"],
      queryFn: getUserOrgs,
    });

    const userSpaces = await queryClient.ensureQueryData({
      queryKey: ["getUserSpaces"],
      queryFn: getUserSpaces,
    });

    return {
      userOrgs,
      userSpaces,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { userOrgs, userSpaces } = useLoaderData({ from: "/spaces" });
  console.log("userOrgs", userOrgs);
  console.log("userSpaces", userSpaces);

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onMutate: (org) => {
      // TODO:
      //   setLoadingStates((prev) => ({ ...prev, [org.id]: true }));
    },
    onSuccess: (_, org) => {
      queryClient.invalidateQueries({ queryKey: ["getUserSpaces"] });
      toast.success(`Space ${org.login} created successfully`);
    },
    onError: (error: Error, org) => {
      toast.error(`Failed to create space ${org.login}: ${error.message}`);
    },
    onSettled: (_, error, org) => {
      // TODO:
      // setLoadingStates((prev) => ({ ...prev, [org.id]: false }));
    },
  });

  const createSpaceMemberMutation = useMutation({
    mutationFn: createSpaceMember,
    onMutate: (org) => {
      // TODO:
      // setLoadingStates((prev) => ({ ...prev, [org.id]: true }));
    },
    onSuccess: (_, org) => {
      queryClient.invalidateQueries({ queryKey: ["getUserSpaces"] });
      toast.success(`Joined organization ${org.login} successfully`);
    },
    onError: (error: Error, org) => {
      if (error.message.includes("doesn't exist yet")) {
        toast.error(error.message);
      } else {
        toast.error(
          `Failed to join organization ${org.login}: ${error.message}`
        );
      }
    },
    onSettled: (_, error, org) => {
      // setLoadingStates((prev) => ({ ...prev, [org.id]: false }));
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
      </div>

      {userOrgs.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userOrgs.map((org) => {
            const isSpaceMember = userSpaces.find(
              (space) => space.github_org_id === org.id
            );

            return (
              <Card
                key={org.login}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate({ to: `/space/${org.login}` })}
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
                <CardFooter className="flex justify-between gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      createSpaceMutation.mutate({
                        avatar_url: org.avatar_url,
                        name: org.login,
                        slug: org.login,
                        github_org_id: String(org.id), // TODO: change database type to number
                      });
                    }}
                    disabled={isLoading || status.exists} // TODO: validate if space is already created
                  >
                    Create
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO:
                      createSpaceMemberMutation.mutate({
                        space_id: "",
                        user_id: "",
                        role: "member",
                      });
                    }}
                    disabled={isSpaceMember}
                  >
                    Join
                  </Button>
                  <Button
                    onClick={() => {
                      navigate({ to: `/space/${org.login}` });
                    }}
                    disabled={!isSpaceMember}
                  >
                    View
                  </Button>
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

  // const filteredOrganizations =
  //   organizations?.filter(
  //     (org) =>
  //       org.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       (org.description &&
  //         org.description.toLowerCase().includes(searchTerm.toLowerCase()))
  //   ) || [];

  // const navigateToOrg = (org: any) => {
  //   navigate({ to: `/orgs/${org.login}` });
  // };

  // if (isLoadingOrganizations) {
  //   return <OrganizationsListSkeleton />;
  // }

  // if (organizationsError) {
  //   return (
  //     <div className="container mx-auto py-8">
  //       <div className="text-center py-10">
  //         <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
  //         <p className="text-muted-foreground">
  //           {(organizationsError as Error).message}
  //         </p>
  //         <Button
  //           className="mt-4"
  //           onClick={() => queryClient.refetchQueries(["userOrgs"])}
  //         >
  //           Retry
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  // return (
  //   <div className="container mx-auto py-8">
  //     <div className="flex justify-between items-center mb-6">
  //       <h1 className="text-3xl font-bold">Organizations</h1>
  //       <div className="relative w-64">
  //         <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
  //         <Input
  //           placeholder="Search organizations..."
  //           className="pl-8"
  //           value={searchTerm}
  //           onChange={(e) => setSearchTerm(e.target.value)}
  //         />
  //       </div>
  //     </div>

  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //       {filteredOrganizations.map((org) => {
  //         const status = orgStatuses[org.id] || {
  //           exists: false,
  //           isMember: false,
  //         };
  //         const isLoading = loadingStates[org.id];

  //         return (
  //           <Card
  //             key={org.login}
  //             className="cursor-pointer hover:shadow-md transition-shadow"
  //             onClick={() => navigateToOrg(org)}
  //           >
  //             <CardHeader>
  //               <div className="flex items-center gap-2">
  //                 {org.avatar_url && (
  //                   <img
  //                     src={org.avatar_url}
  //                     alt={org.login}
  //                     width={32}
  //                     height={32}
  //                     className="rounded-full"
  //                   />
  //                 )}
  //                 <CardTitle>{org.login}</CardTitle>
  //               </div>
  //               {org.description && (
  //                 <CardDescription className="mt-2">
  //                   {org.description}
  //                 </CardDescription>
  //               )}
  //             </CardHeader>
  //             <CardContent>
  //               <a
  //                 href={githubRedirect().accountOrOrg(org.login)}
  //                 target="_blank"
  //                 rel="noopener noreferrer"
  //                 className="text-sm text-blue-600 hover:underline"
  //                 onClick={(e) => e.stopPropagation()}
  //               >
  //                 View on GitHub
  //               </a>
  //             </CardContent>
  //             <CardFooter className="flex justify-between gap-2">
  //               <Button
  //                 variant={status.exists ? "secondary" : "outline"}
  //                 size="sm"
  //                 onClick={(e) => {
  //                   e.stopPropagation();
  //                   createOrgMutation.mutate(org);
  //                 }}
  //                 disabled={isLoading || status.exists}
  //               >
  //                 {isLoading
  //                   ? "Creating..."
  //                   : status.exists
  //                   ? "Created"
  //                   : "Create"}
  //               </Button>
  //               <Button
  //                 variant={status.isMember ? "secondary" : "ghost"}
  //                 size="sm"
  //                 onClick={(e) => {
  //                   e.stopPropagation();
  //                   joinOrgMutation.mutate(org);
  //                 }}
  //                 disabled={isLoading || status.isMember || !status.exists}
  //               >
  //                 {isLoading
  //                   ? "Joining..."
  //                   : status.isMember
  //                   ? `Joined (${status.role})`
  //                   : "Join"}
  //               </Button>
  //             </CardFooter>
  //           </Card>
  //         );
  //       })}
  //     </div>

  //     {filteredOrganizations.length === 0 && !isLoadingOrganizations && (
  //       <div className="text-center py-10">
  //         <p className="text-muted-foreground">
  //           No organizations found matching your search.
  //         </p>
  //       </div>
  //     )}
  //   </div>
  // );
}
