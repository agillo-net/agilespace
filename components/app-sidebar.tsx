"use client";

import * as React from "react";
import Link from "next/link";
import { User, Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import the extracted components
import { NavSidebar } from "@/components/sidebar/nav-sidebar";
import { OrganizationSidebar } from "@/components/sidebar/organization-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import {
  OrgSidebarSkeleton,
  ProfileSidebarSkeleton,
} from "@/components/sidebar/sidebar-skeletons";

// Initial data structure for loading state
const initialData = {
  user: {
    name: "Loading...",
    email: "loading@example.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Profile",
      url: "#",
      icon: User,
      isActive: true,
      isCustomIcon: false,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = React.useState<any>(null);
  const [orgsData, setOrgsData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // State for organization-specific data in the second sidebar
  const [orgRepos, setOrgRepos] = React.useState<any[]>([]);
  const [orgProjects, setOrgProjects] = React.useState<any[]>([]);
  const [orgTeams, setOrgTeams] = React.useState<any[]>([]);
  const [orgSidebarLoading, setOrgSidebarLoading] = React.useState(false);
  const [orgSidebarError, setOrgSidebarError] = React.useState<string | null>(
    null
  );

  // State for user profile data in the second sidebar
  const [userIssues, setUserIssues] = React.useState<any[]>([]);
  const [userPullRequests, setUserPullRequests] = React.useState<any[]>([]);
  const [profileSidebarLoading, setProfileSidebarLoading] =
    React.useState(false);
  const [profileSidebarError, setProfileSidebarError] = React.useState<
    string | null
  >(null);

  // Track expanded sections
  const [expandedSections, setExpandedSections] = React.useState({
    repositories: true,
    projects: false,
    teams: false,
    issues: true,
    pullRequests: true,
  });

  // Create data object based on fetched data
  const data = React.useMemo(() => {
    // If still loading, return initialData
    if (isLoading) return initialData;

    // User data for the NavUser component
    const user = {
      name: userData?.name || userData?.login || "Unknown User",
      email: userData?.email || `@${userData?.login}`,
      avatar: userData?.avatar_url || "",
    };

    // Create navigation items from organizations
    const navMain = [
      // Always include the user profile as first item
      {
        title: "Profile",
        url: "/profile",
        avatar: '',
        icon: User,
        isActive: pathname === "/profile",
        isCustomIcon: false,
      },
      // Map organizations to nav items
      ...orgsData.map((org) => ({
        title: org.login,
        url: `/org/${org.login}`,
        avatar: org.avatar_url, // Store the org avatar URL
        isActive: pathname === `/org/${org.login}`,
        isCustomIcon: true, // Flag to indicate we should use the avatar instead of an icon
        org: org, // Store the full org data for use in the details page
      })),
    ];

    return {
      user,
      navMain,
    };
  }, [userData, orgsData, isLoading, pathname]);

  // Fetch GitHub user and organizations data
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user data
        const userResponse = await fetch("/api/github/user");
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();
        setUserData(userData);

        // Fetch organizations data
        const orgsResponse = await fetch("/api/github/orgs");
        if (!orgsResponse.ok) throw new Error("Failed to fetch organizations");
        const orgsData = await orgsResponse.json();
        setOrgsData(orgsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const { setOpen } = useSidebar();

  // Navigation handler with data loading for organization resources
  const handleNavigation = async (item: any) => {
    setActiveItem(item);
    router.push(item.url);
    setOpen(true);

    // If it's an organization, fetch its resources for the second sidebar
    if (item.isCustomIcon && item.title) {
      setOrgSidebarLoading(true);
      setOrgSidebarError(null);

      try {
        // Fetch repos, projects, and teams in parallel
        const [reposRes, projectsRes, teamsRes] = await Promise.allSettled([
          fetch(`/api/github/org/${item.title}/repos`),
          fetch(`/api/github/org/${item.title}/projects`),
          fetch(`/api/github/org/${item.title}/teams`),
        ]);

        // Handle repositories
        if (reposRes.status === "fulfilled" && reposRes.value.ok) {
          const reposData = await reposRes.value.json();
          setOrgRepos(reposData);
        } else {
          setOrgRepos([]);
          console.error("Failed to load repositories");
        }

        // Handle projects
        if (projectsRes.status === "fulfilled" && projectsRes.value.ok) {
          const projectsData = await projectsRes.value.json();
          setOrgProjects(projectsData);
        } else {
          setOrgProjects([]);
          console.error("Failed to load projects");
        }

        // Handle teams
        if (teamsRes.status === "fulfilled" && teamsRes.value.ok) {
          const teamsData = await teamsRes.value.json();
          setOrgTeams(teamsData);
        } else {
          setOrgTeams([]);
          console.error("Failed to load teams");
        }
      } catch (err) {
        console.error("Error fetching organization resources:", err);
        setOrgSidebarError("Failed to load organization resources");
      } finally {
        setOrgSidebarLoading(false);
      }
    } else if (item.url === "/profile") {
      // For profile, fetch issues and PRs
      setProfileSidebarLoading(true);
      setProfileSidebarError(null);

      // Reset org data
      setOrgRepos([]);
      setOrgProjects([]);
      setOrgTeams([]);

      try {
        // Fetch issues and PRs in parallel
        const [issuesRes, prsRes] = await Promise.allSettled([
          fetch("/api/github/issues"),
          fetch("/api/github/pull-requests"),
        ]);

        // Handle issues
        if (issuesRes.status === "fulfilled" && issuesRes.value.ok) {
          const issuesData = await issuesRes.value.json();
          setUserIssues(issuesData);
        } else {
          setUserIssues([]);
          console.error("Failed to load user issues");
        }

        // Handle pull requests
        if (prsRes.status === "fulfilled" && prsRes.value.ok) {
          const prsData = await prsRes.value.json();
          setUserPullRequests(prsData);
        } else {
          setUserPullRequests([]);
          console.error("Failed to load pull requests");
        }
      } catch (err) {
        console.error("Error fetching user resources:", err);
        setProfileSidebarError("Failed to load user resources");
      } finally {
        setProfileSidebarLoading(false);
      }
    } else {
      // Reset all data for other navigation items
      setOrgRepos([]);
      setOrgProjects([]);
      setOrgTeams([]);
      setUserIssues([]);
      setUserPullRequests([]);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Determine if we're viewing an organization or profile
  const isViewingOrg = React.useMemo(
    () => activeItem?.isCustomIcon === true,
    [activeItem]
  );
  const isViewingProfile = React.useMemo(
    () => activeItem?.url === "/profile",
    [activeItem]
  );

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* First sidebar - Navigation */}
      <NavSidebar data={data} handleNavigation={handleNavigation} />

      {/* Second sidebar - Details */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium flex items-center gap-2">
              {activeItem?.isCustomIcon && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={activeItem.avatar} alt={activeItem.title} />
                  <AvatarFallback>{activeItem.title.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              {activeItem?.title}
            </div>
            {isViewingOrg && (
              <Link
                href={`/org/${activeItem.title}`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View Details
              </Link>
            )}
          </div>
          <SidebarInput
            placeholder="Search..."
            className="flex items-center gap-2"
            icon={<Search className="h-4 w-4" />}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {isViewingOrg &&
                (orgSidebarLoading ? (
                  <OrgSidebarSkeleton />
                ) : orgSidebarError ? (
                  <div className="p-4 text-sm text-red-500">
                    Error loading organization data: {orgSidebarError}
                  </div>
                ) : (
                  <OrganizationSidebar
                    repos={orgRepos}
                    projects={orgProjects}
                    teams={orgTeams}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    orgName={activeItem.title}
                  />
                ))}

              {isViewingProfile &&
                (profileSidebarLoading ? (
                  <ProfileSidebarSkeleton />
                ) : profileSidebarError ? (
                  <div className="p-4 text-sm text-red-500">
                    Error loading profile data: {profileSidebarError}
                  </div>
                ) : (
                  <ProfileSidebar
                    issues={userIssues}
                    pullRequests={userPullRequests}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                  />
                ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
