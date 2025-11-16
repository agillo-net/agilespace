import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, Clock, Activity, ListTodo, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberStats } from "@/hooks/api/use-member-stats";
import { formatTime, getGitHubIssueUrl } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getSpaceBySlug } from "@/lib/supabase/queries";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/space/$slug/members/$id/stats/")({
  component: MemberStatsPage,
});

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

function MemberStatsPage() {
  const { slug, id } = Route.useParams();
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("week");

  // Fetch space data - this ensures it works on reload
  const { data: space, isLoading: isSpaceLoading, error: spaceError } = useQuery({
    queryKey: queryKeys.spaces.bySlug(slug),
    queryFn: () => getSpaceBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const spaceId = space?.id;

  const {
    member,
    profile,
    sessions,
    totalSessions,
    totalDuration,
    trackStats,
    activeSession,
    isLoading: isStatsLoading,
    error: statsError,
  } = useMemberStats(id, spaceId || "", timeFilter);

  // Combined loading state - we're loading if space is loading OR stats are loading
  // Stats loading includes waiting for spaceId, so we should respect it
  const isLoading = isSpaceLoading || isStatsLoading;
  const error = spaceError || statsError;

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show error state if we have an error or missing data after loading
  if (!isLoading && (error || !spaceId || !member || !profile)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/space/$slug/members" params={{ slug }}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {error ? `Failed to load member statistics` : !spaceId ? "Space not found" : "Member not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const trackChartData = trackStats.slice(0, 10).map((stat) => ({
    name: stat.track.title.length > 30
      ? stat.track.title.substring(0, 30) + "..."
      : stat.track.title,
    sessions: stat.sessionCount,
    duration: stat.totalDuration / (1000 * 60 * 60), // Convert to hours
  }));

  const pieChartData = trackStats.slice(0, 5).map((stat) => ({
    name: stat.track.title.length > 20
      ? stat.track.title.substring(0, 20) + "..."
      : stat.track.title,
    value: stat.totalDuration,
  }));

  // Calculate tag statistics (session count)
  const tagStatsMap = new Map<string, { tag: any; count: number }>();
  sessions.forEach((session) => {
    if (session.tags && session.tags.length > 0) {
      session.tags.forEach((tagRelation: any) => {
        const tagId = tagRelation.tag.id;
        if (tagStatsMap.has(tagId)) {
          tagStatsMap.get(tagId)!.count += 1;
        } else {
          tagStatsMap.set(tagId, {
            tag: tagRelation.tag,
            count: 1,
          });
        }
      });
    }
  });

  const tagChartData = Array.from(tagStatsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((stat) => ({
      name: stat.tag.name,
      sessions: stat.count,
      color: stat.tag.color,
    }));

  // Calculate time spent per tag (including no tags)
  const tagTimeMap = new Map<string, { tag: any; duration: number }>();
  let noTagsDuration = 0;

  sessions.forEach((session) => {
    if (!session.ended_at) return;

    const sessionDuration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();

    if (session.tags && session.tags.length > 0) {
      session.tags.forEach((tagRelation: any) => {
        const tagId = tagRelation.tag.id;
        if (tagTimeMap.has(tagId)) {
          tagTimeMap.get(tagId)!.duration += sessionDuration;
        } else {
          tagTimeMap.set(tagId, {
            tag: tagRelation.tag,
            duration: sessionDuration,
          });
        }
      });
    } else {
      noTagsDuration += sessionDuration;
    }
  });

  const tagTimeData = [
    ...Array.from(tagTimeMap.values()).map((stat) => ({
      name: stat.tag.name,
      hours: stat.duration / (1000 * 60 * 60), // Convert to hours
      duration: stat.duration,
      color: stat.tag.color,
    })),
    ...(noTagsDuration > 0 ? [{
      name: "No Tags",
      hours: noTagsDuration / (1000 * 60 * 60),
      duration: noTagsDuration,
      color: "#9CA3AF", // Gray color
    }] : [])
  ].sort((a, b) => b.hours - a.hours);

  const sessionsWithSummary = sessions.filter(s => s.comment_url).length;
  const sessionsSkipped = sessions.filter(s => s.skipped_summary).length;
  const sessionsWithoutSummary = totalSessions - sessionsWithSummary - sessionsSkipped;

  const stats = [
    {
      title: "Total Sessions",
      value: totalSessions,
      icon: Calendar,
      description: "Completed sessions",
    },
    {
      title: "Total Time",
      value: formatTime(totalDuration),
      icon: Clock,
      description: "Time tracked",
    },
    {
      title: "Active Session",
      value: activeSession ? "In Progress" : "None",
      icon: Activity,
      description: activeSession ? "Currently working" : "No active session",
    },
    {
      title: "Tracks Worked",
      value: trackStats.length,
      icon: ListTodo,
      description: "Different tracks",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/space/$slug/members" params={{ slug }}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                {profile.full_name?.charAt(0) || profile.github_username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {member.nickname || profile.full_name || profile.github_username}
              </h1>
              <p className="text-sm text-muted-foreground">Member Statistics</p>
            </div>
          </div>
        </div>
        <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      {trackStats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Bar Chart - Sessions per Track */}
          <Card>
            <CardHeader>
              <CardTitle>Sessions by Track</CardTitle>
              <CardDescription>Number of sessions per track</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trackChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Time Distribution</CardTitle>
              <CardDescription>Time spent per track (top 5)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatTime(value)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Legend
                    formatter={(value, entry: any) => `${value} (${formatTime(entry.payload.value)})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tag Statistics and Summary Stats */}
      {(tagChartData.length > 0 || totalSessions > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tag Usage Chart */}
          {tagChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tag Usage</CardTitle>
                <CardDescription>Most frequently used tags</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tagChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#8884d8">
                      {tagChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Session Summaries</CardTitle>
              <CardDescription>Summary documentation status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">With Summary</span>
                  </div>
                  <span className="text-2xl font-bold text-green-700">{sessionsWithSummary}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Skipped</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-700">{sessionsSkipped}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">No Summary</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-700">{sessionsWithoutSummary}</span>
                </div>
              </div>
              {totalSessions > 0 && (
                <div className="pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Summary Rate: {Math.round((sessionsWithSummary / totalSessions) * 100)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time per Tag Chart */}
      {tagTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Time Spent per Tag</CardTitle>
            <CardDescription>Total hours logged for each tag category (including untagged sessions)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={tagTimeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number, _name: string, props: any) => [
                    `${value.toFixed(2)} hours (${formatTime(props.payload.duration)})`,
                    'Time Spent'
                  ]}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                />
                <Bar dataKey="hours" fill="#8884d8" radius={[8, 8, 0, 0]}>
                  {tagTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Track Statistics Table */}
      {trackStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Track Statistics</CardTitle>
            <CardDescription>Detailed breakdown of tracks worked on</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Total Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackStats.map((stat) => (
                  <TableRow key={stat.track.id}>
                    <TableCell className="font-medium">
                      <a
                        href={getGitHubIssueUrl(stat.track)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {stat.track.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {stat.track.repo_owner}/{stat.track.repo_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{stat.sessionCount}</TableCell>
                    <TableCell className="text-right">{formatTime(stat.totalDuration)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions Table */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Latest completed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ended</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-center">Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 20).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.track ? (
                        <a
                          href={getGitHubIssueUrl(session.track)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {session.track.title}
                        </a>
                      ) : (
                        "Unknown Track"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {session.tags && session.tags.length > 0 ? (
                          session.tags.map((tagRelation: any) => (
                            <Badge
                              key={tagRelation.tag.id}
                              variant="outline"
                              style={{
                                backgroundColor: tagRelation.tag.color + "20",
                                borderColor: tagRelation.tag.color,
                                color: tagRelation.tag.color,
                              }}
                            >
                              {tagRelation.tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No tags</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(session.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {session.ended_at ? new Date(session.ended_at).toLocaleString() : "In Progress"}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.ended_at
                        ? formatTime(
                            new Date(session.ended_at).getTime() -
                              new Date(session.started_at).getTime()
                          )
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {session.comment_url ? (
                        <a
                          href={session.comment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : session.skipped_summary ? (
                        <span className="text-xs text-muted-foreground">Skipped</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalSessions === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No sessions found for the selected period. Try selecting a different time range.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
