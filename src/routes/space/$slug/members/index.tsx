import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getSpaceMembersWithProfiles } from '@/lib/supabase/queries'
import { MembersListSkeleton } from '@/components/skeleton/members-list-skeleton'

export const Route = createFileRoute('/space/$slug/members/')({
    component: MembersPage,
})

function MembersPage() {
    const { slug } = Route.useParams()

    const { data: members, isLoading } = useQuery({
        queryKey: ['getSpaceMembers', slug],
        queryFn: () => getSpaceMembersWithProfiles(slug),
    })

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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members && members.map(({ member, profile }) => {
                            const name = profile.full_name || 'Unknown'
                            const joinedDate = member.joined_at ? new Date(member.joined_at).toLocaleString() : 'N/A'
                            const avatarUrl = profile.avatar_url || 'https://www.gravatar.com/avatar/' + btoa(name.trim().toLowerCase())
                            const avatarFallback = name.slice(0, 2).toUpperCase()

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
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 
