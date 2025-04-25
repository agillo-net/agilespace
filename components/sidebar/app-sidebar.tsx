"use client";

import * as React from "react";
import { GitHubOrg, GitHubUser } from "@/lib/github";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { OrgSwitcher } from "@/components/sidebar/org-switcher";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: GitHubUser;
  orgs: GitHubOrg[];
}

export function AppSidebar({ user, orgs, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher orgs={orgs} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
