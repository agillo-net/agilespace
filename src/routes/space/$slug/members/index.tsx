import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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
import { MembersListSkeleton } from '@/components/skeleton/members-list-skeleton'
import { Badge } from '@/components/ui/badge'
import { getGitHubIssueUrl, getSessionDuration, formatTime } from '@/lib/utils'
import { useSpaceMembers } from '@/hooks/api/use-space-members'

export const Route = createFileRoute('/space/$slug/members/')({
    component: MembersPage,
})

function MembersPage() {
    const { slug } = Route.useParams()
    const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("today")
    const showDuration = false // Control visibility of duration display
    const { members, isLoading, activeSessions } = useSpaceMembers(slug, timeFilter);

    if (isLoading) {
        return (
            <MembersListSkeleton />
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Members</h1>
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
                                        <span className="font-medium">
                                            {timeWorked > 0 ? formatTime(timeWorked) : '0h 0m'}
                                        </span>
                                    </TableCell>
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
