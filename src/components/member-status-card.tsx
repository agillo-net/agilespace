import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getGitHubIssueUrl, formatTime } from "@/lib/utils";
import type { ActiveSession } from "@/types";
import type { getSpaceMembersWithProfiles } from "@/lib/supabase/queries";

type Members = Awaited<ReturnType<typeof getSpaceMembersWithProfiles>>;

interface MemberStatusCardProps {
  members: Members | undefined;
  activeSessions: ActiveSession[] | undefined;
  dailyDurations: Record<string, number>;
}

export function MemberStatusCard({ members, activeSessions, dailyDurations }: MemberStatusCardProps) {
  return (
    <Card className="py-0">
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {members && members.length > 0 ? (
          <div className="divide-y">
            {members.map(({ member, profile }) => {
              const activeSession = activeSessions?.find(
                (s) => s?.space_member?.user_id === member.user_id
              );
              const duration = formatTime(dailyDurations[member.user_id] || 0);
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.full_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium leading-none">
                      {profile.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.role}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {member.status || "offline"}
                      </Badge>
                      {member.status === "online" && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {member.location || "remote"}
                        </Badge>
                      )}
                    </div>
                    {activeSession ? (
                      <a
                        href={getGitHubIssueUrl(activeSession.track)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1"
                      >
                        {activeSession.track.title}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500 mt-1">No active ticket</span>
                    )}
                    <span className="text-xs text-gray-600 mt-1">{duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-3 text-sm">No members found.</p>
        )}
      </CardContent>
    </Card>
  );
}
