"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useGithubStore } from "@/store/github-store";
import { useUIStore } from "@/store/ui-store";
import {
  getOrgRepos,
  getOrgProjects,
  getOrgTeams,
  getUserIssues,
  getUserPullRequests,
} from "@/lib/github-client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { OrganizationSidebar } from "@/components/sidebar/organization-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import {
  OrgSidebarSkeleton,
  ProfileSidebarSkeleton,
} from "@/components/sidebar/skeleton-sidebar";
import { OrgSwitcher } from "@/components/org-switcher";

export function OrgSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();

  // Get state from GitHub store
  const {
    user,
    orgs,
    repos,
    projects,
    teams,
    issues,
    pullRequests,
    isLoadingOrgResources,
    isLoadingUserResources,
    orgsError: orgResourcesError,
    userResourcesError,
    setRepos: setRepositories,
    setProjects,
    setTeams,
    setIssues,
    setPullRequests,
    setIsLoadingOrgResources,
    setIsLoadingUserResources,
    setOrgsError: setOrgResourcesError,
    setUserResourcesError,
    resetOrgResourcesState,
    resetUserResourcesState,
  } = useGithubStore();

  // Get UI state
  const { expandedSections, toggleSection, activeOrganization } = useUIStore();
  const { setOpen } = useSidebar();

  // Determine if we're viewing profile or organization
  const [viewMode, setViewMode] = React.useState<"profile" | "organization">(
    "organization"
  );

  // Check the current path to determine what we're viewing
  React.useEffect(() => {
    // Move both functions inside useEffect
    const loadOrganizationData = async (orgName: string) => {
      setIsLoadingOrgResources(true);
      resetOrgResourcesState();
      resetUserResourcesState();

      try {
        // Fetch repos, projects, and teams in parallel using github-client
        const [reposData, projectsData, teamsData] = await Promise.all([
          getOrgRepos(orgName),
          getOrgProjects(orgName),
          getOrgTeams(orgName),
        ]);

        setRepositories(reposData);
        setProjects(projectsData);
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching organization resources:", error);
        setOrgResourcesError(
          error instanceof Error
            ? error.message
            : "Failed to load organization resources"
        );
      } finally {
        setIsLoadingOrgResources(false);
      }
    };

    const loadProfileData = async () => {
      setIsLoadingUserResources(true);
      resetOrgResourcesState();
      resetUserResourcesState();

      try {
        // Fetch issues and PRs in parallel using github-client
        const [issuesData, prsData] = await Promise.all([
          getUserIssues(),
          getUserPullRequests(),
        ]);

        setIssues(issuesData);
        setPullRequests(prsData);
      } catch (error) {
        console.error("Error fetching user resources:", error);
        setUserResourcesError(
          error instanceof Error ? error.message : "Failed to load user resources"
        );
      } finally {
        setIsLoadingUserResources(false);
      }
    };

    if (pathname === "/profile") {
      setViewMode("profile");
      loadProfileData();
    } else if (activeOrganization) {
      setViewMode("organization");
      loadOrganizationData(activeOrganization);
    }
  }, [
    pathname, 
    activeOrganization, 
    setIsLoadingOrgResources, 
    resetOrgResourcesState, 
    resetUserResourcesState, 
    setRepositories, 
    setProjects, 
    setTeams, 
    setOrgResourcesError, 
    setIsLoadingUserResources, 
    setIssues, 
    setPullRequests, 
    setUserResourcesError
  ]);

  // Format user data for display
  const userData = React.useMemo(() => {
    if (!user)
      return { name: "Loading...", email: "loading@example.com", avatar: "" };

    return {
      name: user.name || user.login || "Unknown User",
      email: user.login ? `@${user.login}` : "",
      avatar: user.avatarUrl || "",
    };
  }, [user]);

  // Create formatted navigation items
  const navItems = React.useMemo(() => {
    return orgs.map((org: any) => ({
      title: org.login,
      url: `/${org.login}`,
      avatar: org.avatarUrl,
      isActive: org.login === activeOrganization,
    }));
  }, [orgs, activeOrganization]);

  const { setActiveOrganization } = useUIStore();

  const handleNavigation = async (org: { title: string; url: string }) => {
    setActiveOrganization(org.title);
    router.push(org.url);
    setOpen(true);
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <OrgSwitcher navItems={navItems} handleNavigation={handleNavigation} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {viewMode === "organization" &&
              (isLoadingOrgResources ? (
                <OrgSidebarSkeleton />
              ) : orgResourcesError ? (
                <div className="p-4 text-sm text-red-500">
                  Error loading organization data: {orgResourcesError}
                </div>
              ) : (
                <OrganizationSidebar
                  repos={repos}
                  projects={projects}
                  teams={teams}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  orgName={activeOrganization || ""}
                />
              ))}

            {viewMode === "profile" &&
              (isLoadingUserResources ? (
                <ProfileSidebarSkeleton />
              ) : userResourcesError ? (
                <div className="p-4 text-sm text-red-500">
                  Error loading profile data: {userResourcesError}
                </div>
              ) : (
                <ProfileSidebar
                  issues={issues}
                  pullRequests={pullRequests}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                />
              ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
