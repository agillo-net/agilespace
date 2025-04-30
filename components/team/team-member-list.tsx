"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitHubUser } from "@/lib/github";

type TeamMember = {
  user_id: string;
  role: "owner" | "member";
  profile: {
    display_name: string;
    avatar_url: string | null;
    github_username: string | null;
  };
};

type TeamMemberListProps = {
  members: TeamMember[];
  organizationId: string;
  isOwner: boolean;
};

export function TeamMemberList({
  members,
  organizationId,
  isOwner,
}: TeamMemberListProps) {
  const supabase = createClient();
  const router = useRouter();

  const removeTeamMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("organization_id", organizationId)
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Team member removed successfully");
      router.refresh();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border divide-y">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar>
                <AvatarImage
                  src={
                    member.profile.avatar_url ||
                    `https://github.com/${member.profile.github_username}.png`
                  }
                  alt={member.profile.display_name}
                />
                <AvatarFallback>
                  {member.profile.display_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {member.profile.display_name}
                  </span>
                  <Badge
                    variant={member.role === "owner" ? "default" : "secondary"}
                  >
                    {member.role}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  @{member.profile.github_username}
                </div>
              </div>
            </div>
            {isOwner && member.role !== "owner" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTeamMember(member.user_id)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
