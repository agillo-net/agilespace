import { createFileRoute } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MembersListSkeleton } from '@/components/skeleton/members-list-skeleton'
import { Badge } from '@/components/ui/badge'
import { getGitHubIssueUrl, getSessionDuration } from '@/lib/utils'
import { useSpaceMembers } from '@/hooks/api/use-space-members'

export const Route = createFileRoute('/space/$slug/members/')({
    component: MembersPage,
})

function MembersPage() {
    const { slug } = Route.useParams()
    const showDuration = false // Control visibility of duration display
    const { members, isLoading, activeSessions } = useSpaceMembers(slug);

    if (isLoading) {
        return (
            <MembersListSkeleton />
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Members</h1>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Active Ticket</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members && members.map(({ member, profile }) => {
                            const name = profile.full_name || 'Unknown'
                            const joinedDate = member.joined_at ? new Date(member.joined_at).toLocaleString() : 'N/A'
                            const avatarUrl = profile.avatar_url || 'https://www.gravatar.com/avatar/' + btoa(name.trim().toLowerCase())
                            const avatarFallback = name.slice(0, 2).toUpperCase()

                            // Find active session for this member
                            const activeSession = activeSessions?.find(session => session?.space_member.user_id === member.user_id)
                            const sessionDuration = activeSession ? getSessionDuration(activeSession.started_at, new Date().toISOString()) : null

                            return (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={avatarUrl} alt={name} />
                                                <AvatarFallback>{avatarFallback}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{member.role}</TableCell>
                                    <TableCell>{joinedDate}</TableCell>
                                    <TableCell>
                                        {activeSession ? (
                                            <div className={showDuration ? "flex flex-col gap-1" : "flex items-center gap-2"}>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                                        Active
                                                    </Badge>
                                                    <a
                                                        href={getGitHubIssueUrl(activeSession.track)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        {activeSession.track.title}
                                                    </a>
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
