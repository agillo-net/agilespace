"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGithubStore } from "@/store/github-store";
import { useUIStore } from "@/store/ui-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();

  // Get state from GitHub store using the new implementation
  const {
    user,
    orgs,
    isLoadingUser,
    isLoadingOrgs,
    fetchUserProfile,
    fetchUserOrgs,
  } = useGithubStore();

  // Get UI state
  const { setActiveOrganization } = useUIStore();
  const { setOpen } = useSidebar();

  // Fetch GitHub user and organizations data
  React.useEffect(() => {
    fetchUserProfile();
    fetchUserOrgs();
  }, [fetchUserProfile, fetchUserOrgs]);

  // Navigation handler
  const handleNavigation = async (org: {
    title: string;
    url: string;
    avatar: string;
    isActive: boolean;
  }) => {
    setActiveOrganization(org.title);
    router.push(org.url);
    setOpen(true);
  };

  // Format user data for display
  const userData = React.useMemo(() => {
    if (!user)
      return { name: "Loading...", email: "loading@example.com", avatar: "" };

    return {
      name: user.name || user.login || "Unknown User",
      email: `@${user.login}`, // GitHub GraphQL API doesn't return email, we use login instead
      avatar: user.avatarUrl || "",
    };
  }, [user]);

  // Create navigation items from organizations
  const navItems = React.useMemo(() => {
    return orgs.map((org) => ({
      title: org.login,
      url: `/orgs/${org.login}`,
      avatar: org.avatarUrl,
      isActive: pathname === `/orgs/${org.login}`,
    }));
  }, [orgs, pathname]);

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organizations</SidebarGroupLabel>
          <SidebarMenu>
            {isLoadingOrgs ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : navItems.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No organizations found
              </div>
            ) : (
              navItems.map((org) => (
                <SidebarMenuItem key={org.title}>
                  <SidebarMenuButton
                    tooltip={{
                      children: org.title,
                      hidden: false,
                    }}
                    onClick={() => handleNavigation(org)}
                    isActive={org.isActive}
                    className="gap-2 p-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={org.avatar} alt={org.title} />
                      <AvatarFallback className="text-xs">
                        {org.title.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{org.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
