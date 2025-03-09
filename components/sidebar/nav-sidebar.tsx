import * as React from "react";
import { Command } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavUser } from "@/components/nav-user";

interface NavSidebarProps {
  data: {
    user: {
      name: string;
      email: string;
      avatar: string;
    };
    navMain: Array<{
      title: string;
      url: string;
      icon?: React.ComponentType<{ className?: string }>;
      isActive: boolean;
      isCustomIcon: boolean;
      avatar?: string;
    }>;
  };
  handleNavigation: (item: any) => void;
}

export function NavSidebar({ data, handleNavigation }: NavSidebarProps) {
  return (
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
                      item.icon && <item.icon className="size-4" />
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
  );
}
