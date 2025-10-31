import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepoPermissions, getRepoPermission } from "@/lib/supabase/queries";
import {
  syncRepoPermissions,
  checkUserRepoAccess,
  getUserAccessibleRepos,
} from "@/lib/supabase/mutations";
import { getOrgReposWithPermissions } from "@/lib/github/queries";
import { getOrganizationById } from "@/lib/github/queries";

/**
 * Hook to fetch all repo permissions for a user in a space
 */
export function useRepoPermissions(spaceId: string) {
  return useQuery({
    queryKey: ["repo-permissions", spaceId],
    queryFn: () => getRepoPermissions(spaceId),
    enabled: !!spaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch permission for a specific repo
 */
export function useRepoPermission(
  spaceId: string,
  repoOwner: string,
  repoName: string
) {
  return useQuery({
    queryKey: ["repo-permission", spaceId, repoOwner, repoName],
    queryFn: () => getRepoPermission(spaceId, repoOwner, repoName),
    enabled: !!spaceId && !!repoOwner && !!repoName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to check if user has access to a repo (uses RPC function)
 */
export function useCheckRepoAccess(
  spaceId: string,
  repoOwner: string,
  repoName: string,
  minPermission: string = "read"
) {
  return useQuery({
    queryKey: ["check-repo-access", spaceId, repoOwner, repoName, minPermission],
    queryFn: () => checkUserRepoAccess(spaceId, repoOwner, repoName, minPermission),
    enabled: !!spaceId && !!repoOwner && !!repoName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get all accessible repos for user in a space (uses RPC function)
 */
export function useAccessibleRepos(spaceId: string, minPermission: string = "read") {
  return useQuery({
    queryKey: ["accessible-repos", spaceId, minPermission],
    queryFn: () => getUserAccessibleRepos(spaceId, minPermission),
    enabled: !!spaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to sync repo permissions from GitHub
 */
export function useSyncRepoPermissions(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (githubOrgId: number) => {
      // Get the organization details
      const org = await getOrganizationById(githubOrgId);

      // Fetch repos with permissions from GitHub
      const repos = await getOrgReposWithPermissions(org.login);

      // Sync to database
      return await syncRepoPermissions(
        spaceId,
        repos.map((repo) => ({
          owner: repo.owner,
          name: repo.name,
          permission: repo.permission,
        }))
      );
    },
    onSuccess: () => {
      // Invalidate all permission-related queries
      queryClient.invalidateQueries({ queryKey: ["repo-permissions", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["accessible-repos", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["check-repo-access", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["repo-permission", spaceId] });
    },
  });
}
