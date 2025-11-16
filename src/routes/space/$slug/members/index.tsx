import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MembersListSkeleton } from '@/components/skeleton/members-list-skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Play } from 'lucide-react'
import { getGitHubIssueUrl, getSessionDuration, formatTime } from '@/lib/utils'
import { useSpaceMembers, useUpdateSpaceMemberRole } from '@/hooks/api/use-space-members'
import { useSessions } from '@/hooks/api/use-sessions'
import { useSyncRepoPermissions } from '@/hooks/api/use-repo-permissions'
import { useSpacePermissions } from '@/hooks/api/use-permissions'
import { getSpaceBySlug } from '@/lib/supabase/queries'
import { checkRepositoryAccess } from '@/lib/github/queries'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { RoleSelector } from '@/components/members/role-selector'
import type { Role } from '@/lib/permissions/constants'

export const Route = createFileRoute('/space/$slug/members/')({
    component: MembersPage,
})

function MembersPage() {
    const { slug } = Route.useParams()
    const navigate = useNavigate()
    const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("today")
    const [repoAccessMap, setRepoAccessMap] = useState<Record<string, boolean>>({})
    const showDuration = false // Control visibility of duration display
    const { members, isLoading, activeSessions } = useSpaceMembers(slug, timeFilter);

    // Session management hook
    const { handleStartSession, activeSession, startSessionMutation } = useSessions(slug);

    // Fetch space data
    const { data: space } = useQuery({
        queryKey: queryKeys.spaces.bySlug(slug),
        queryFn: () => getSpaceBySlug(slug),
        enabled: !!slug,
    });

    const syncPermissions = useSyncRepoPermissions(space?.id || '');

    // Permission check for updating roles
    const { canUpdateRoles } = useSpacePermissions(space?.id);

    // Role update mutation
    const updateRoleMutation = useUpdateSpaceMemberRole(slug);

    const handleRoleChange = async (spaceMemberId: string, newRole: Role) => {
        await updateRoleMutation.mutateAsync({ spaceMemberId, newRole });
    };

    // Check repository access for all active sessions
    useEffect(() => {
        const checkAccess = async () => {
            if (!activeSessions || activeSessions.length === 0) return;

            const accessChecks = activeSessions.map(async (session) => {
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
    }, [activeSessions]);

    const handleSyncPermissions = async () => {
        if (!space?.github_org_id) {
            toast.error("Space doesn't have a GitHub organization linked");
            return;
        }

        try {
            const result = await syncPermissions.mutateAsync(space.github_org_id);
            toast.success(`Successfully synced ${result.synced} repositories!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to sync permissions");
        }
    };

    if (isLoading) {
        return (
            <MembersListSkeleton />
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Members</h1>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleSyncPermissions}
                        disabled={syncPermissions.isPending || !space?.github_org_id}
                        variant="outline"
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncPermissions.isPending ? 'animate-spin' : ''}`} />
                        {syncPermissions.isPending ? 'Syncing...' : 'Sync GitHub Permissions'}
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Time Period:</span>
                        <Select value={timeFilter} onValueChange={(value: "today" | "week" | "month") => setTimeFilter(value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">Week</SelectItem>
                                <SelectItem value="month">Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Time Worked</TableHead>
                            <TableHead>Active Ticket</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members && members.map(({ member, profile, timeWorked }) => {
                            const name = profile?.full_name || 'Unknown'
                            const joinedDate = member.joined_at ? new Date(member.joined_at).toLocaleString() : 'N/A'
                            const avatarUrl = profile?.avatar_url || 'https://www.gravatar.com/avatar/' + btoa(name.trim().toLowerCase())
                            const avatarFallback = name.slice(0, 2).toUpperCase()

                            // Find active session for this member
                            const memberSession = activeSessions?.find(session => session?.space_member.user_id === member.user_id)
                            const sessionDuration = memberSession ? getSessionDuration(memberSession.started_at, new Date().toISOString()) : null

                            return (
                                <TableRow
                                    key={member.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate({ to: '/space/$slug/members/$id/stats', params: { slug, id: member.id } })}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={avatarUrl} alt={name} />
                                                <AvatarFallback>{avatarFallback}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {canUpdateRoles ? (
                                            <RoleSelector
                                                currentRole={member.role as Role}
                                                memberId={member.id}
                                                memberName={name}
                                                onRoleChange={handleRoleChange}
                                                disabled={updateRoleMutation.isPending}
                                            />
                                        ) : (
                                            <span className="capitalize">{member.role}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{joinedDate}</TableCell>
                                    <TableCell>
                                        <span className="font-medium">
                                            {timeWorked > 0 ? formatTime(timeWorked) : '0h 0m'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {memberSession ? (
                                            <div className={showDuration ? "flex flex-col gap-1" : "flex items-center gap-2"}>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                                        Active
                                                    </Badge>
                                                    <a
                                                        href={getGitHubIssueUrl(memberSession.track)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {memberSession.track.title}
                                                    </a>
                                                    {(() => {
                                                        const repoKey = `${memberSession.track.repo_owner}/${memberSession.track.repo_name}`;
                                                        const hasRepoAccess = repoAccessMap[repoKey] ?? true;
                                                        const currentUserHasActiveSession = !!activeSession;
                                                        const isStarting = startSessionMutation.isPending;

                                                        return (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                handleStartSession(memberSession.track.id)
                                                                            }}
                                                                            disabled={isStarting || currentUserHasActiveSession || !hasRepoAccess}
                                                                        >
                                                                            <Play className="h-4 w-4 mr-1" />
                                                                            Start Session
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            {!hasRepoAccess
                                                                                ? "You don't have access to this repository"
                                                                                : currentUserHasActiveSession
                                                                                    ? "You already have an active session"
                                                                                    : "Start a new session for this track"
                                                                            }
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })()}
                                                </div>
                                                {showDuration && (
                                                    <span className="text-sm text-gray-500">
                                                        Working for {sessionDuration}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">No active ticket</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 
