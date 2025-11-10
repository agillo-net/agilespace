/**
 * Example Components for GitHub Repo Permissions
 *
 * These examples show how to integrate the repo permissions system
 * into your application.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useRepoPermissions,
  useCheckRepoAccess,
  useAccessibleRepos,
  useSyncRepoPermissions,
} from "@/hooks/api/use-repo-permissions";
import type { Space } from "@/types";

// =====================================================
// EXAMPLE 1: Sync Permissions Button
// =====================================================

export function SyncPermissionsButton({ space }: { space: Space }) {
  const syncPermissions = useSyncRepoPermissions(space.id);

  const handleSync = async () => {
    if (!space.github_org_id) {
      toast.error("Space doesn't have a GitHub organization linked");
      return;
    }

    try {
      const result = await syncPermissions.mutateAsync(space.github_org_id);
      toast.success(`Successfully synced ${result.synced} repositories!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to sync permissions");
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncPermissions.isPending || !space.github_org_id}
    >
      {syncPermissions.isPending ? "Syncing..." : "Sync GitHub Permissions"}
    </Button>
  );
}

// =====================================================
// EXAMPLE 2: Permission Badge
// =====================================================

export function PermissionBadge({ permission }: { permission: string }) {
  const colors: Record<string, string> = {
    none: "bg-gray-500",
    read: "bg-blue-500",
    triage: "bg-green-500",
    write: "bg-yellow-500",
    maintain: "bg-orange-500",
    admin: "bg-red-500",
  };

  return (
    <Badge className={colors[permission] || colors.none}>
      {permission}
    </Badge>
  );
}

// =====================================================
// EXAMPLE 3: User Permissions List
// =====================================================

export function UserPermissionsList({ spaceId }: { spaceId: string }) {
  const { data: permissions, isLoading } = useRepoPermissions(spaceId);

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  if (!permissions || permissions.length === 0) {
    return (
      <div className="text-muted-foreground">
        No permissions found. Sync your GitHub permissions first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Your Repository Permissions</h3>
      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Repository</th>
              <th className="text-left p-2">Permission</th>
              <th className="text-left p-2">Last Synced</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id} className="border-b last:border-0">
                <td className="p-2 font-mono text-sm">
                  {perm.repo_owner}/{perm.repo_name}
                </td>
                <td className="p-2">
                  <PermissionBadge permission={perm.permission_level} />
                </td>
                <td className="p-2 text-sm text-muted-foreground">
                  {new Date(perm.last_synced_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 4: Protected Track Button
// =====================================================

interface ProtectedTrackButtonProps {
  spaceId: string;
  repoOwner: string;
  repoName: string;
  issueNumber: number;
  onTrack: () => void;
}

export function ProtectedTrackButton({
  spaceId,
  repoOwner,
  repoName,
  issueNumber,
  onTrack,
}: ProtectedTrackButtonProps) {
  const { data: hasAccess, isLoading } = useCheckRepoAccess(
    spaceId,
    repoOwner,
    repoName,
    "read"
  );

  if (isLoading) {
    return <Button disabled>Checking access...</Button>;
  }

  if (!hasAccess) {
    return (
      <Button disabled variant="secondary">
        No Access
      </Button>
    );
  }

  return (
    <Button onClick={onTrack}>
      Track Issue #{issueNumber}
    </Button>
  );
}

// =====================================================
// EXAMPLE 5: Filtered Issues List
// =====================================================

interface FilteredIssuesListProps {
  spaceId: string;
  allIssues: Array<{
    id: number;
    title: string;
    repository: {
      owner: string;
      name: string;
    };
  }>;
}

export function FilteredIssuesList({ spaceId, allIssues }: FilteredIssuesListProps) {
  const { data: accessibleRepos, isLoading } = useAccessibleRepos(spaceId, "read");

  if (isLoading) {
    return <div>Loading accessible repositories...</div>;
  }

  // Filter issues to only show ones from repos user can access
  const filteredIssues = allIssues.filter((issue) => {
    return accessibleRepos?.some(
      (repo) =>
        repo.repo_owner === issue.repository.owner &&
        repo.repo_name === issue.repository.name
    );
  });

  if (filteredIssues.length === 0) {
    return (
      <div className="text-muted-foreground">
        No accessible issues found. You may need to sync your permissions or
        request access to more repositories.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Showing {filteredIssues.length} of {allIssues.length} issues
        (filtered by your repository access)
      </div>
      <div className="space-y-2">
        {filteredIssues.map((issue) => (
          <div key={issue.id} className="border rounded p-3">
            <div className="font-semibold">{issue.title}</div>
            <div className="text-sm text-muted-foreground">
              {issue.repository.owner}/{issue.repository.name} #{issue.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 6: Accessible Repos Summary
// =====================================================

export function AccessibleReposSummary({ spaceId }: { spaceId: string }) {
  const { data: repos, isLoading } = useAccessibleRepos(spaceId, "read");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const permissionCounts = repos?.reduce((acc, repo) => {
    acc[repo.permission_level] = (acc[repo.permission_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Repository Access Summary</h3>
      <div className="flex gap-2">
        <div className="border rounded p-3 flex-1">
          <div className="text-2xl font-bold">{repos?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Accessible Repos</div>
        </div>
        {permissionCounts &&
          Object.entries(permissionCounts).map(([level, count]) => (
            <div key={level} className="border rounded p-3 flex-1">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <PermissionBadge permission={level} />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 7: Complete Permissions Page
// =====================================================

export function PermissionsPage({ space }: { space: Space }) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Repository Permissions</h1>
        <SyncPermissionsButton space={space} />
      </div>

      <AccessibleReposSummary spaceId={space.id} />

      <UserPermissionsList spaceId={space.id} />
    </div>
  );
}
