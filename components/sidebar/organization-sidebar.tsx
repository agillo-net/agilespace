"use client";

import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { useGithubStore } from "@/store/github-store";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CollapsibleSection } from "@/components/sidebar/collapsible-section";
import { ExternalLink } from "@/components/ui/external-link";

export function OrganizationSidebar() {
  const { org } = useParams<{ org: string }>();
  const pathname = usePathname();

  const { repos, isLoadingRepos, fetchUserRepos } = useGithubStore();

  // Fetch repositories for this organization
  useEffect(() => {
    fetchUserRepos();
  }, [fetchUserRepos]);

  // Filter repositories by the current organization
  const orgRepositories = repos.filter((repo) => repo.owner === org);

  return (
    <Sidebar>
      <CollapsibleSection
        title={`${org} Repositories`}
        icon={null}
        count={orgRepositories.length}
        isOpen={true}
        onToggle={() => {}}
      >
        <SidebarMenu>
          {isLoadingRepos ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Loading repositories...
            </div>
          ) : orgRepositories.length === 0 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              No repositories found for this organization
            </div>
          ) : (
            orgRepositories.map((repo) => (
              <SidebarMenuItem key={repo.id}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === `/orgs/${org}/${repo.name}`}
                >
                  <ExternalLink href={repo.url} className="flex items-center">
                    {repo.name}
                  </ExternalLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </CollapsibleSection>
    </Sidebar>
  );
}
