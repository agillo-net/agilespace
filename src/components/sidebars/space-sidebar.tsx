import * as React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, ListMusic, Calendar, Users, Tags } from 'lucide-react'
import { Link, useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { User } from '@supabase/supabase-js'
import type { Space } from "@/types";

interface SpaceSidebarProps {
    space: Space | null;
}

// Define the sidebar menu items with icons and links
const sidebarMenu = [
    {
        label: "Dashboard",
        icon: <LayoutDashboard />,
        tooltip: "Dashboard",
        link: "/space/$slug",
    },
    {
        label: "Tracks",
        icon: <ListMusic />,
        tooltip: "Tracks",
        link: "/space/$slug/tracks",
    },
    {
        label: "Sessions",
        icon: <Calendar />,
        tooltip: "Sessions",
        link: "/space/$slug/sessions",
    },
    {
        label: "Members",
        icon: <Users />,
        tooltip: "Members",
        link: "/space/$slug/members",
    },
    {
        label: "Tags",
        icon: <Tags />,
        tooltip: "Tags",
        link: "/space/$slug/tags",
    },
];

// Function to map user data to the format required by NavUser
const mapUser = (user: User | null) => {
    if (!user) return {
        name: "Guest",
        email: "",
        avatar: "",
    }
    return {
        name: user.user_metadata?.full_name || user.user_metadata?.user_name || "Unknown User",
        email: user.email || "",
        avatar: user.user_metadata?.avatar_url || "",
    };
}

const mapSpace = (space: Space | null) => {
    if (!space) return {
        name: "Default Space",
        slug: "",
        avatar: "/default-avatar.png",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
    return {
        name: space.name || "Default Space",
        slug: space.slug || "",
        avatar: space.avatar_url || "/default-avatar.png",
        created_at: space.created_at || new Date().toISOString(),
        updated_at: space.updated_at || new Date().toISOString(),
    };
}

export function SpaceSidebar({ space, ...props }: React.ComponentProps<typeof Sidebar> & SpaceSidebarProps) {
    const { user } = useAuth()
    const router = useRouter()

    const userData = React.useMemo(() => {
        return mapUser(user);
    }, [user])

    const spaceData = React.useMemo(() => {
        return mapSpace(space);
    }, [space]);


    return (
        <Sidebar
            {...props}
        >
            <SidebarHeader className="flex h-14 justify-center items-center bg-white border-b">
                <SidebarGroupLabel className="text-lg text-black font-semibold">
                    <img
                        src={spaceData.avatar}
                        alt={spaceData.name}
                        className="w-8 h-8 rounded-full mr-2"
                    />
                    {space?.name || "Space Name"}
                </SidebarGroupLabel>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroupContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sm text-muted-foreground">
                            Navigation
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {sidebarMenu.map((item) => {
                                const currentPath = router.state.location.pathname
                                const isActive = currentPath === item.link.replace('$slug', space?.name?.toLowerCase() || '')

                                return (
                                    <SidebarMenuItem key={item.label}>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                to={item.link}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                                                    isActive
                                                    && "bg-accent text-green-700 hover:!text-green-700 hover:bg-accent/80"
                                                )}
                                            >
                                                {item.icon}
                                                <span className={cn(isActive && "hover:!text-green-700")}>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarGroupContent>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    );
}
