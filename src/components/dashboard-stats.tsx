import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Calendar, Tag } from 'lucide-react';

interface DashboardStatsProps {
    totalSessions: number;
    activeSessions: number;
    totalTracks: number;
    totalMembers: number;
    totalTags: number;
}

export function DashboardStats({
    totalSessions,
    activeSessions,
    totalTracks,
    totalMembers,
    totalTags
}: DashboardStatsProps) {
    const stats = [
        { title: 'Total Sessions', value: totalSessions, icon: Calendar },
        { title: 'Active Sessions', value: activeSessions, icon: Activity },
        { title: 'Total Tracks', value: totalTracks, icon: '📊' },
        { title: 'Total Members', value: totalMembers, icon: Users },
        { title: 'Total Tags', value: totalTags, icon: Tag },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        {typeof stat.icon === 'string' ? (
                            <span className="text-2xl">{stat.icon}</span>
                        ) : (
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 
