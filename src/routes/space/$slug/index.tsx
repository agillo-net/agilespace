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
import { useAuth } from '@/hooks/api/use-auth'
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
import { StatusEditor } from '@/components/status-editor'
import { DashboardStats } from '@/components/dashboard-stats'
import { SessionActivityChart } from '@/components/session-activity-chart'
import { TrackStatsChart } from '@/components/track-stats-chart'
import { ActiveSessionsList } from '@/components/active-sessions-list'
import { useSpaceDashboard } from '@/hooks/api/use-space-dashboard'

export const Route = createFileRoute('/space/$slug/')({
  component: SpaceHome,
}) as {
  useParams: () => { slug: string }
}

function SpaceHome() {
  const { slug } = Route.useParams()
  const [openSections, setOpenSections] = useLocalStorage('space-sections', {
    stats: true,
    activeSessions: true,
    sessionActivity: true,
    trackStats: true
  })

  const {
    spaceData,
    spaceActiveSessions,
    totalSessions,
    activeSessionsCount,
    totalTracks,
    totalMembers,
    totalTags,
    sessionActivityData,
    trackStatsData,
  } = useSpaceDashboard(slug);

  return (
    <div className='space-y-6'>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {spaceData?.space_member && (
          <StatusEditor
            initialStatus={spaceData.space_member.status || 'offline'}
            initialLocation={spaceData.space_member.location || 'remote'}
            slug={slug}
          />
        )}
      </div>

      <Collapsible
        open={openSections.stats}
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, stats: open }))}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Statistics</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.stats && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <DashboardStats
            totalSessions={totalSessions}
            activeSessions={activeSessionsCount}
            totalTracks={totalTracks}
            totalMembers={totalMembers}
            totalTags={totalTags}
          />
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
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.activeSessions && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <ActiveSessionsList sessions={spaceActiveSessions || []} />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Collapsible
          className="lg:col-span-4 space-y-2"
          open={openSections.sessionActivity}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, sessionActivity: open }))}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Session Activity</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.sessionActivity && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <SessionActivityChart data={sessionActivityData} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          className="lg:col-span-3 space-y-2"
          open={openSections.trackStats}
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, trackStats: open }))}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Track Stats</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.trackStats && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <TrackStatsChart data={trackStatsData} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
