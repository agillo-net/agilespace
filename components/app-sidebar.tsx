"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGithubStore } from "@/store/github-store";
import { useUIStore } from "@/store/ui-store";
import { fetchOrganizations, fetchUserData } from "@/lib/api-services";
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
import { NavUser } from "@/components/nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();

  // Get state from GitHub store
  const {
    user,
    organizations,
    isLoadingOrganizations,
    setUser,
    setOrganizations,
    setIsLoadingUser,
    setIsLoadingOrganizations,
    setUserError,
    setOrganizationsError
  } = useGithubStore();

  // Get UI state
  const { setActiveOrganization } = useUIStore();
  const { setOpen } = useSidebar();

  // Fetch GitHub user and organizations data
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoadingUser(true);
      setIsLoadingOrganizations(true);

      try {
        // Fetch user data
        const userData = await fetchUserData();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserError(error instanceof Error ? error.message : "Failed to fetch user data");
      } finally {
        setIsLoadingUser(false);
      }

      try {
        // Fetch organizations data
        const orgsData = await fetchOrganizations();
        setOrganizations(orgsData);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizationsError(error instanceof Error ? error.message : "Failed to fetch organizations");
      } finally {
        setIsLoadingOrganizations(false);
      }
    };

    fetchData();
  }, [
    setIsLoadingOrganizations,
    setIsLoadingUser,
    setOrganizations,
    setOrganizationsError,
    setUser,
    setUserError
  ]);

  // Navigation handler
  const handleNavigation = async (org: { title: string; url: string; avatar: string; isActive: boolean }) => {
    setActiveOrganization(org.title);
    router.push(org.url);
    setOpen(true);
  };

  // Format user data for display
  const userData = React.useMemo(() => {
    if (!user) return { name: "Loading...", email: "loading@example.com", avatar: "" };

    return {
      name: user.name || user.login || "Unknown User",
      email: user.email || `@${user.login}`,
      avatar: user.avatar_url || "",
    };
  }, [user]);

  // Create navigation items from organizations
  const navItems = React.useMemo(() => {
    return organizations.map((org) => ({
      title: org.login,
      url: `/orgs/${org.login}`,
      avatar: org.avatar_url,
      isActive: pathname === `/${org.login}`,
    }));
  }, [organizations, pathname]);

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organizations</SidebarGroupLabel>
          <SidebarMenu>
            {isLoadingOrganizations ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : navItems.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">No organizations found</div>
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
