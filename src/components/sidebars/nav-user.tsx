import { ChevronsUpDown, LogOut, Palette } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/lib/supabase/mutations";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

type NavUserProps = {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
};

export function NavUser({
    user,
}: NavUserProps) {

    const { isMobile } = useSidebar();
    const router = useRouter();

    const signOut = useMutation({
        mutationFn: logout,
        onSettled: () => {
            router.navigate({ to: "/login" });
        }
    });

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel
                            className="p-0 font-normal cursor-pointer hover:bg-muted"
                            onClick={() => {
                                // TODO: Handle user profile click
                            }}
                        >
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <div className="px-2 py-1.5">
                                <div className="flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    <span className="mr-auto text-sm" color="black">Theme</span>
                                    {/* TODO: <ThemeToggle />  */}
                                </div>
                            </div>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                            signOut.mutate();
                        }} className="cursor-pointer hover:bg-red-500 hover:text-white" disabled={signOut.isPending}>
                            <div className="flex items-center gap-2">
                                <LogOut className="h-4 w-4" color="black" />
                                <span className="mr-auto text-sm">Log out</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
