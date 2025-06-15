import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Calendar, Tag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSpaceAndTracks, getActiveSession, getClosedSessions, getTrackSessionStats } from '@/lib/supabase/queries'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import React from 'react'

export const Route = createFileRoute('/space/$slug/')({
  component: SpaceHome,
}) as {
  useParams: () => { slug: string }
}

function SpaceHome() {
  const { slug } = Route.useParams()

  // Load space and tracks data
  const { data: spaceData } = useQuery({
    queryKey: ['space', slug],
    queryFn: () => getSpaceAndTracks(slug)
  })

  // Load active session
  const { data: activeSession } = useQuery({
    queryKey: ['activeSession', slug],
    queryFn: () => getActiveSession(),
    enabled: !!slug
  })

  // Load closed sessions
  const { data: closedSessions } = useQuery({
    queryKey: ['closedSessions', spaceData?.space?.id],
    queryFn: () => getClosedSessions(spaceData?.space?.id || ''),
    enabled: !!spaceData?.space?.id
  })

  // Load session stats for tracks
  const { data: sessionStats } = useQuery({
    queryKey: ['sessionStats', spaceData?.tracks?.map(t => t.id)],
    queryFn: () => getTrackSessionStats(spaceData?.tracks?.map(t => t.id) || []),
    enabled: !!spaceData?.tracks?.length
  })

  // Calculate total sessions
  const totalSessions = closedSessions?.length || 0
  const activeSessions = activeSession ? 1 : 0

  // Calculate total tracks
  const totalTracks = spaceData?.tracks?.length || 0

  // Calculate total members
  const totalMembers = 0 // TODO: Implement member count

  // Calculate total tags
  const totalTags = 0 // TODO: Implement tag count

  // Prepare session activity data for the line chart
  const sessionActivityData = React.useMemo(() => {
    if (!closedSessions) return []

    // Group sessions by date
    const sessionsByDate = closedSessions.reduce((acc, session) => {
      const date = new Date(session.ended_at!).toLocaleDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Convert to array format for recharts
    return Object.entries(sessionsByDate).map(([date, count]) => ({
      date,
      sessions: count
    })).slice(-7) // Show last 7 days
  }, [closedSessions])

  // Prepare track statistics data for the bar chart
  const trackStatsData = React.useMemo(() => {
    if (!spaceData?.tracks || !sessionStats) return []

    return spaceData.tracks.map(track => ({
      name: track.title,
      sessions: sessionStats.counts[track.id] || 0
    }))
  }, [spaceData?.tracks, sessionStats])

  return (
    <div className='space-y-6'>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions + activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              {activeSessions} active, {totalSessions} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tracks
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTracks}</div>
            <p className="text-xs text-muted-foreground">
              Learning tracks available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active members in this space
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tags
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags}</div>
            <p className="text-xs text-muted-foreground">
              Content tags available
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Session Activity</CardTitle>
            <CardDescription>
              Sessions completed in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Track Statistics</CardTitle>
            <CardDescription>
              Sessions per track
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackStatsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
