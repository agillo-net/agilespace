import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { getGitHubIssueUrl } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play } from "lucide-react";
import { useState, useEffect } from "react";
import { checkRepositoryAccess } from "@/lib/github/queries";
import type { getSpaceActiveSessions } from "@/lib/supabase/queries";

type ActiveSessions = Awaited<ReturnType<typeof getSpaceActiveSessions>>;

interface ActiveSessionsListProps {
    sessions: ActiveSessions;
    onStartSession?: (trackId: string) => void;
    isStarting?: boolean;
    hasActiveSession?: boolean;
}

export function ActiveSessionsList({ sessions, onStartSession, isStarting, hasActiveSession }: ActiveSessionsListProps) {
    const [repoAccessMap, setRepoAccessMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const checkAccess = async () => {
            if (!sessions || sessions.length === 0) return;

            const accessChecks = sessions.map(async (session) => {
                const key = `${session.track.repo_owner}/${session.track.repo_name}`;
                const hasAccess = await checkRepositoryAccess(
                    session.track.repo_owner,
                    session.track.repo_name
                );
                return { key, hasAccess };
            });

            const results = await Promise.all(accessChecks);
            const accessMap = results.reduce((acc, { key, hasAccess }) => {
                acc[key] = hasAccess;
                return acc;
            }, {} as Record<string, boolean>);

            setRepoAccessMap(accessMap);
        };

        checkAccess();
    }, [sessions]);
    return (
        <Card className='py-0'>
            <CardContent className="p-0">
                {sessions && sessions.length > 0 ? (
                    <div className="divide-y">
                        {sessions.map((session) => {
                            const repoKey = `${session.track.repo_owner}/${session.track.repo_name}`;
                            const hasRepoAccess = repoAccessMap[repoKey] ?? true; // Default to true while checking

                            return (
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
                                    {onStartSession && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onStartSession(session.track.id)}
                                                        disabled={isStarting || hasActiveSession || !hasRepoAccess}
                                                    >
                                                        <Play className="h-4 w-4 mr-1" />
                                                        Start Session
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        {!hasRepoAccess
                                                            ? "You don't have access to this repository"
                                                            : hasActiveSession
                                                                ? "You already have an active session"
                                                                : "Start a new session for this track"
                                                        }
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            );
                        })}
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
