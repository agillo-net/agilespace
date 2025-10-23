import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getGitHubIssueUrl } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { getSpaceActiveSessions } from "@/lib/supabase/queries";

type ActiveSessions = Awaited<ReturnType<typeof getSpaceActiveSessions>>;

interface ActiveSessionsListProps {
    sessions: ActiveSessions;
}

export function ActiveSessionsList({ sessions }: ActiveSessionsListProps) {
    return (
        <Card className='py-0'>
            <CardContent className="p-0">
                {sessions && sessions.length > 0 ? (
                    <div className="divide-y">
                        {sessions.map((session) => (
                            <div key={session.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={session.space_member?.profile?.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {session.space_member?.profile?.full_name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{session.space_member?.profile?.full_name || 'Unknown User'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <a
                                    href={getGitHubIssueUrl(session.track)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-sm text-blue-600 hover:text-blue-700 hover:underline truncate"
                                >
                                    {session.track.title}
                                </a>
                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 text-xs">
                                    Active
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-3 text-sm">
                        No active sessions at the moment
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
