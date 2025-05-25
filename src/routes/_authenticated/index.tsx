import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUserOrgs } from '@/lib/github/queries';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createOrgMutation, joinOrgMutation } from '@/lib/supabase/mutations';
import { getOrganizationAndMemberStatus } from '@/lib/supabase/queries';
import { toast } from 'sonner';
import { githubRedirect } from '@/lib/utils';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganizationsListSkeleton } from '@/components/skeleton/OrganizationsList';

export const Route = createFileRoute("/_authenticated/")({
  component: RouteComponent,
})

interface OrgStatus {
  exists: boolean;
  isMember: boolean;
  role?: string;
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Fetch user organizations
  const {
    data: organizations,
    error: organizationsError,
    isLoading: isLoadingOrganizations,
  } = useQuery({
    queryKey: ['userOrgs'],
    queryFn: async () => {
      const orgsData = await getUserOrgs();
      return orgsData.data;
    },
  });

  // Fetch status for each organization
  const orgStatusQueries = useQueries({
    queries: organizations?.map((org) => ({
      queryKey: ['orgStatus', org.id, user?.id],
      queryFn: async () => {
        if (!user) throw new Error('User not available');
        return await getOrganizationAndMemberStatus(org.id.toString(), user.id);
      },
      enabled: !!user && !!organizations,
    })) || [],
  });

  // Create statuses object from queries
  const orgStatuses = useMemo(() => {
    const statuses: Record<string, OrgStatus> = {};
    organizations?.forEach((org, index) => {
      const query = orgStatusQueries[index];
      statuses[org.id] = query?.data || { exists: false, isMember: false };
    });
    return statuses;
  }, [organizations, orgStatusQueries]);

  // Create organization mutation
  const createOrgMutationHook = useMutation({
    mutationFn: async (org: any) => {
      if (!user) throw new Error('User not available');
      return await createOrgMutation(org, user.id);
    },
    onMutate: (org) => {
      setLoadingStates(prev => ({ ...prev, [org.id]: true }));
    },
    onSuccess: (_, org) => {
      queryClient.invalidateQueries({ queryKey: ['orgStatus', org.id, user?.id] });
      toast.success(`Organization ${org.login} created successfully`);
    },
    onError: (error: Error, org) => {
      toast.error(`Failed to create organization ${org.login}: ${error.message}`);
    },
    onSettled: (_, _2, org) => {
      setLoadingStates(prev => ({ ...prev, [org.id]: false }));
    },
  });

  // Join organization mutation
  const joinOrgMutationHook = useMutation({
    mutationFn: async (org: any) => {
      if (!user) throw new Error('User not available');
      return await joinOrgMutation(org, user.id);
    },
    onMutate: (org) => {
      setLoadingStates(prev => ({ ...prev, [org.id]: true }));
    },
    onSuccess: (_, org) => {
      queryClient.invalidateQueries({ queryKey: ['orgStatus', org.id, user?.id] });
      toast.success(`Joined organization ${org.login} successfully`);
    },
    onError: (error: Error, org) => {
      if (error.message.includes("doesn't exist yet")) {
        toast.error(error.message);
      } else {
        toast.error(`Failed to join organization ${org.login}: ${error.message}`);
      }
    },
    onSettled: (_, _2, org) => {
      setLoadingStates(prev => ({ ...prev, [org.id]: false }));
    },
  });

  const filteredOrganizations = organizations?.filter(org =>
    org.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const navigateToOrg = (org: any) => {
    navigate({ to: `/orgs/${org.login}` });
  }

  if (isLoadingOrganizations) {
    return (
      <OrganizationsListSkeleton />
    );
  }

  if (organizationsError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground">{(organizationsError as Error).message}</p>
          <Button className="mt-4" onClick={() => queryClient.refetchQueries({ queryKey: ['userOrgs'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map((org) => {
          const status = orgStatuses[org.id] || { exists: false, isMember: false };
          const isLoading = loadingStates[org.id];

          return (
            <Card
              key={org.login}
              className="hover:shadow-md transition-shadow"
              onClick={() => navigateToOrg(org)}
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
                {org.description && <CardDescription className="mt-2">
                  {org.description}
                </CardDescription>}
              </CardHeader>
              <CardContent>
                <a
                  href={githubRedirect().accountOrOrg(org.login)}
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
                  variant={status.exists ? "secondary" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    createOrgMutationHook.mutate(org);
                  }}
                  disabled={isLoading || status.exists}
                >
                  {isLoading ? "Creating..." : status.exists ? "Created" : "Create"}
                </Button>
                <Button
                  variant={status.isMember ? "secondary" : "ghost"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    joinOrgMutationHook.mutate(org);
                  }}
                  disabled={isLoading || status.isMember || !status.exists}
                >
                  {isLoading ? "Joining..." : status.isMember ? `Joined (${status.role})` : "Join"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {filteredOrganizations.length === 0 && !isLoadingOrganizations && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No organizations found matching your search.</p>
        </div>
      )}
    </div>
  );

}
