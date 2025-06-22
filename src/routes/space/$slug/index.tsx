import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Calendar, Tag, Edit2, Check, X, ChevronDown } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSpaceAndTracks, getActiveSession, getClosedSessions, getTrackSessionStats, getSpaceActiveSessions, getCurrentMemberStatus } from '@/lib/supabase/queries'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import React from 'react'
import { updateMemberStatus } from '@/lib/supabase/mutations'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { notifyStatusUpdate, type StatusUpdate } from '@/lib/notifications/utils'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getGitHubIssueUrl } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocalStorage } from '@/hooks/use-local-storage'

export const Route = createFileRoute('/space/$slug/')({
  component: SpaceHome,
}) as {
  useParams: () => { slug: string }
}

function SpaceHome() {
  const { slug } = Route.useParams()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = React.useState(false)
  const { user } = useAuth()
  const [openSections, setOpenSections] = useLocalStorage('space-sections', {
    stats: true,
    activeSessions: true,
    sessionActivity: true,
    trackStats: true
  })

  // Form setup
  const form = useForm<StatusUpdate>({
    defaultValues: {
      status: 'offline',
      location: 'remote'
    }
  })

  // Watch status value to control location field
  const status = form.watch('status')

  // Load space and tracks data
  const { data: spaceData } = useQuery({
    queryKey: ['space', slug],
    queryFn: () => getSpaceAndTracks(slug)
  })

  // Update form values when spaceData changes
  React.useEffect(() => {
    if (spaceData?.space_member) {
      form.reset({
        status: spaceData.space_member.status || 'offline',
        location: spaceData.space_member.location || 'remote'
      })
    }
  }, [spaceData?.space_member, form])

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

  // Load all active sessions for the space
  const { data: spaceActiveSessions } = useQuery({
    queryKey: ['spaceActiveSessions', spaceData?.space?.id],
    queryFn: () => getSpaceActiveSessions(spaceData?.space?.id || ''),
    enabled: !!spaceData?.space?.id
  })

  // Update member status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: StatusUpdate) => {
      // Get current status to check if update is needed
      const currentStatus = await getCurrentMemberStatus()

      // Check if the new values are the same as current values
      if (currentStatus && currentStatus.status === data.status && currentStatus.location === data.location) {
        // No update needed, throw an error to prevent unnecessary operations
        throw new Error('Status and location are already set to these values')
      }

      // Update status in database
      await updateMemberStatus(data)

      // Send notification
      await notifyStatusUpdate(user, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space', slug] })
      toast.success('Status updated successfully')
      setIsEditing(false)
    },
    onError: (error: Error) => {
      if (error.message === 'Status and location are already set to these values') {
        toast.info('No changes needed - status is already up to date')
        setIsEditing(false)
      } else {
        toast.error(`Failed to update status: ${error.message}`)
      }
    }
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

  const onSubmit = (data: StatusUpdate) => {
    updateStatusMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset({
      status: spaceData?.space_member?.status || 'offline',
      location: spaceData?.space_member?.location || 'remote'
    })
    setIsEditing(false)
  }

  return (
    <div className='space-y-6'>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {spaceData?.space_member && (
          <div className="flex items-center gap-4">
            {!isEditing ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-sm text-muted-foreground">
                    {spaceData.space_member.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                {spaceData.space_member.status === 'online' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm text-muted-foreground">
                      {spaceData.space_member.location === 'office' ? 'In Office' : 'Remote'}
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="online" id="online" />
                              <Label htmlFor="online">Online</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="offline" id="offline" />
                              <Label htmlFor="offline">Offline</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-2"
                            disabled={status === 'offline'}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="office" id="office" />
                              <Label htmlFor="office">In Office</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="remote" id="remote" />
                              <Label htmlFor="remote">Remote</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateStatusMutation.isPending}
                      className="h-8 w-8 p-0"
                    >
                      {updateStatusMutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={updateStatusMutation.isPending}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <Collapsible
        open={openSections.stats}
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, stats: open }))}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Statistics</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.stats ? "transform rotate-180" : "")} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>

      {/* Active Sessions and Track Statistics Row */}
      <div className="grid grid-cols-1 gap-4">
        {/* Active Sessions Widget */}
        <Collapsible
          open={openSections.activeSessions}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, activeSessions: open }))}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.activeSessions ? "transform rotate-180" : "")} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <Card className='py-0'>
              <CardContent className="p-0">
                {spaceActiveSessions && spaceActiveSessions.length > 0 ? (
                  <div className="divide-y">
                    {spaceActiveSessions.map((session) => (
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
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Collapsible
          open={openSections.sessionActivity}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, sessionActivity: open }))}
          className="col-span-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Session Activity</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.sessionActivity ? "transform rotate-180" : "")} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <Card>
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
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.trackStats}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, trackStats: open }))}
          className="col-span-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Track Statistics</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.trackStats ? "transform rotate-180" : "")} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <Card>
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
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
