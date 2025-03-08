"use client";

import * as React from "react";
import {
  Command,
  User,
  ChevronDown,
  ChevronRight,
  Code,
  Users,
  FolderKanban,
  Book,
  Search,
  GitPullRequest,
  CircleAlert,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
  mails: [
    {
      name: "William Smith",
      email: "williamsmith@example.com",
      subject: "Meeting Tomorrow",
      date: "09:34 AM",
      teaser:
        "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    },
    {
      name: "Alice Smith",
      email: "alicesmith@example.com",
      subject: "Re: Project Update",
      date: "Yesterday",
      teaser:
        "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
    {
      name: "Bob Johnson",
      email: "bobjohnson@example.com",
      subject: "Weekend Plans",
      date: "2 days ago",
      teaser:
        "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
    },
    {
      name: "Emily Davis",
      email: "emilydavis@example.com",
      subject: "Re: Question about Budget",
      date: "2 days ago",
      teaser:
        "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
    },
    {
      name: "Michael Wilson",
      email: "michaelwilson@example.com",
      subject: "Important Announcement",
      date: "1 week ago",
      teaser:
        "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
    },
    {
      name: "Sarah Brown",
      email: "sarahbrown@example.com",
      subject: "Re: Feedback on Proposal",
      date: "1 week ago",
      teaser:
        "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
    },
    {
      name: "David Lee",
      email: "davidlee@example.com",
      subject: "New Project Idea",
      date: "1 week ago",
      teaser:
        "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
    },
    {
      name: "Olivia Wilson",
      email: "oliviawilson@example.com",
      subject: "Vacation Plans",
      date: "1 week ago",
      teaser:
        "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
    },
    {
      name: "James Martin",
      email: "jamesmartin@example.com",
      subject: "Re: Conference Registration",
      date: "1 week ago",
      teaser:
        "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
    },
    {
      name: "Sophia White",
      email: "sophiawhite@example.com",
      subject: "Team Dinner",
      date: "1 week ago",
      teaser:
        "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
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
  const [profileSidebarLoading, setProfileSidebarLoading] = React.useState(false);
  const [profileSidebarError, setProfileSidebarError] = React.useState<string | null>(null);

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
      mails: initialData.mails, // Keep the existing mails data
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
  const [mails, setMails] = React.useState(data.mails);
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
          fetch('/api/github/issues'),
          fetch('/api/github/pull-requests'),
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

  // Determine if we're viewing an organization
  const isViewingOrg = React.useMemo(() => {
    return activeItem && activeItem.isCustomIcon === true;
  }, [activeItem]);

  const isViewingProfile = React.useMemo(() => {
    return activeItem && activeItem.url === "/profile";
  }, [activeItem]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* First sidebar - same as before */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">GitHub</span>
                    <span className="truncate text-xs">Organizations</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => handleNavigation(item)}
                      isActive={item.isActive}
                      className="px-2.5 md:px-2"
                    >
                      {item.isCustomIcon ? (
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={item.avatar} alt={item.title} />
                          <AvatarFallback className="text-xs">
                            {item.title.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <item.icon className="size-4" />
                      )}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* Second sidebar - modified to show nested org resources */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium flex items-center gap-2">
              {activeItem.isCustomIcon && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={activeItem.avatar} alt={activeItem.title} />
                  <AvatarFallback>{activeItem.title.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              {activeItem.title}
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
                  // Show loading skeletons
                  <OrgSidebarSkeleton />
                ) : orgSidebarError ? (
                  // Show error state
                  <div className="p-4 text-sm text-red-500">
                    Error loading organization data: {orgSidebarError}
                  </div>
                ) : (
                  // Show organization resources in collapsible sections
                  <div className="space-y-0">
                    {/* Repositories Section */}
                    <Collapsible
                      open={expandedSections.repositories}
                      className="border-b"
                    >
                      <CollapsibleTrigger
                        onClick={() => toggleSection("repositories")}
                        className="flex w-full items-center justify-between p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          <span className="font-medium">Repositories</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {orgRepos.length}
                          </Badge>
                        </div>
                        {expandedSections.repositories ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-10 pr-4 pb-3 space-y-1">
                          {orgRepos.length > 0 ? (
                            orgRepos.map((repo) => (
                              <div key={repo.id} className="flex items-center justify-between pr-1">
                                <Link
                                  href={`/org/${activeItem.title}/${repo.name}`}
                                  className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate flex-1"
                                >
                                  {repo.name}
                                </Link>
                                <Link 
                                  href={repo.html_url} 
                                  target="_blank"
                                  className="text-muted-foreground hover:text-foreground p-1 rounded-full"
                                  title="Open in GitHub"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                </Link>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              No repositories found
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Projects Section */}
                    <Collapsible
                      open={expandedSections.projects}
                      className="border-b"
                    >
                      <CollapsibleTrigger
                        onClick={() => toggleSection("projects")}
                        className="flex w-full items-center justify-between p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4" />
                          <span className="font-medium">Projects</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {orgProjects.length}
                          </Badge>
                        </div>
                        {expandedSections.projects ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-10 pr-4 pb-3 space-y-1">
                          {orgProjects.length > 0 ? (
                            orgProjects.map((project) => (
                              <Link
                                key={project.id}
                                href={project.html_url}
                                target="_blank"
                                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
                              >
                                {project.name}
                              </Link>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              No projects found
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Teams Section */}
                    <Collapsible
                      open={expandedSections.teams}
                      className="border-b last:border-b-0"
                    >
                      <CollapsibleTrigger
                        onClick={() => toggleSection("teams")}
                        className="flex w-full items-center justify-between p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Teams</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {orgTeams.length}
                          </Badge>
                        </div>
                        {expandedSections.teams ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-10 pr-4 pb-3 space-y-1">
                          {orgTeams.length > 0 ? (
                            orgTeams.map((team) => (
                              <Link
                                key={team.id}
                                href={`https://github.com/orgs/${activeItem.title}/teams/${team.slug}`}
                                target="_blank"
                                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
                              >
                                {team.name}
                              </Link>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              No teams found
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
                
              {/* Profile Sidebar Content */}
              {isViewingProfile &&
                (profileSidebarLoading ? (
                  // Show loading skeletons
                  <ProfileSidebarSkeleton />
                ) : profileSidebarError ? (
                  // Show error state
                  <div className="p-4 text-sm text-red-500">
                    Error loading profile data: {profileSidebarError}
                  </div>
                ) : (
                  // Show profile resources in collapsible sections
                  <div className="space-y-0">
                    {/* Assigned Issues Section */}
                    <Collapsible
                      open={expandedSections.issues}
                      className="border-b"
                    >
                      <CollapsibleTrigger
                        onClick={() => toggleSection("issues")}
                        className="flex w-full items-center justify-between p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CircleAlert className="h-4 w-4" />
                          <span className="font-medium">Assigned Issues</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {userIssues.length}
                          </Badge>
                        </div>
                        {expandedSections.issues ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-10 pr-4 pb-3 space-y-1">
                          {userIssues.length > 0 ? (
                            userIssues.map((issue) => (
                              <Link
                                key={issue.id}
                                href={issue.html_url}
                                target="_blank"
                                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="truncate flex-1">
                                    {issue.repository ? `${issue.repository.owner.login}/${issue.repository.name}` : ""}
                                    #{issue.number}: {issue.title}
                                  </span>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              No assigned issues found
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Review Requests Section */}
                    <Collapsible
                      open={expandedSections.pullRequests}
                      className="border-b last:border-b-0"
                    >
                      <CollapsibleTrigger
                        onClick={() => toggleSection("pullRequests")}
                        className="flex w-full items-center justify-between p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <GitPullRequest className="h-4 w-4" />
                          <span className="font-medium">Review Requests</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {userPullRequests.length}
                          </Badge>
                        </div>
                        {expandedSections.pullRequests ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-10 pr-4 pb-3 space-y-1">
                          {userPullRequests.length > 0 ? (
                            userPullRequests.map((pr) => (
                              <Link
                                key={pr.id}
                                href={pr.html_url}
                                target="_blank"
                                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="truncate flex-1">
                                    {pr.repository_url ? 
                                      pr.repository_url.replace('https://api.github.com/repos/', '') : ""}
                                    #{pr.number}: {pr.title}
                                  </span>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              No review requests found
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}

// Helper component for loading skeleton
function OrgSidebarSkeleton() {
  return (
    <div className="space-y-0">
      {/* Repository Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-8" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="pl-10 pr-4 mb-2">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>

      {/* Projects Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-8" />
        </div>
      </div>

      {/* Teams Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-8" />
        </div>
      </div>
    </div>
  );
}

// Helper component for profile sidebar loading skeleton
function ProfileSidebarSkeleton() {
  return (
    <div className="space-y-0">
      {/* Issues Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="pl-10 pr-4 mb-2">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>

      {/* PRs Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="pl-10 pr-4 mb-2">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
