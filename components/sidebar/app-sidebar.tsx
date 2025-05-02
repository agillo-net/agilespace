"use client";

import * as React from "react";
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
import {
  SquareChartGantt,
  Users,
  Settings,
  FileClock,
  CircleDot,
} from "lucide-react";

export function AppSidebar({
  activeOrgLogin,
  ...props
}: { activeOrgLogin: string } & React.ComponentProps<typeof Sidebar>) {
  const sidebarItems = [
    {
      title: "Overview",
      icon: SquareChartGantt,
      href: `/dashboard/${activeOrgLogin}/overview`,
    },
    {
      title: "Issues",
      icon: CircleDot,
      href: `/dashboard/${activeOrgLogin}/issues`,
    },
    {
      title: "Sessions",
      icon: FileClock,
      href: `/dashboard/${activeOrgLogin}/sessions`,
    },
    {
      title: "Team",
      icon: Users,
      href: `/dashboard/${activeOrgLogin}/team`,
    },
    {
      title: "Settings",
      icon: Settings,
      href: `/dashboard/${activeOrgLogin}/settings`,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher activeOrgLogin={activeOrgLogin} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
