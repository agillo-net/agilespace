import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useLocalStorage } from '@/hooks/use-local-storage'
import { StatusEditor } from '@/components/status-editor'
import { DashboardStats } from '@/components/dashboard-stats'
import { SessionActivityChart } from '@/components/session-activity-chart'
import { TrackStatsChart } from '@/components/track-stats-chart'
import { ActiveSessionsList } from '@/components/active-sessions-list'
import { TeamMembersCard } from '@/components/team-members-card'
import { TimeHeatmapChart } from '@/components/dashboard/time-heatmap-chart'
import { ProductivityTrendChart } from '@/components/dashboard/productivity-trend-chart'
import { FocusTimeDistribution } from '@/components/dashboard/focus-time-distribution'
import { useEnhancedDashboard } from '@/hooks/use-enhanced-dashboard'
import { useSpaceDashboard } from '@/hooks/api/use-space-dashboard'
import { useSessions } from '@/hooks/api/use-sessions'
import { DashboardSettings, DEFAULT_SECTIONS } from '@/components/dashboard/dashboard-settings'
import type { DashboardSection, DashboardFilter } from '@/components/dashboard/dashboard-settings'

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
    teamMembers: true,
    sessionActivity: true,
    trackStats: true,
    timeHeatmap: true,
    productivityTrend: true,
    activityTimeline: true,
    focusTimeDistribution: true
  })

  // Dashboard settings state
  const [visibleSections, setVisibleSections] = useLocalStorage<DashboardSection[]>('dashboard-visible-sections', DEFAULT_SECTIONS)
  const [dashboardFilters, setDashboardFilters] = useLocalStorage<DashboardFilter>('dashboard-filters', {
    dateRange: '7d',
    teamMembers: [],
    tracks: [],
    sessionTypes: [],
    minDuration: 5
  })

  // Session management hook
  const { handleStartSession, activeSession, startSessionMutation } = useSessions(slug)

  // Helper function to check if a section should be visible
  const isSectionVisible = (sectionId: string) => {
    const section = visibleSections.find(s => s.id === sectionId)
    return section?.enabled ?? true
  }

  // Settings handlers
  const handleSectionsChange = (newSections: DashboardSection[]) => {
    setVisibleSections(newSections)
  }

  const handleFiltersChange = (newFilters: DashboardFilter) => {
    setDashboardFilters(newFilters)
  }

  const handleResetToDefaults = () => {
    setVisibleSections(DEFAULT_SECTIONS)
    setDashboardFilters({
      dateRange: '7d',
      teamMembers: [],
      tracks: [],
      sessionTypes: [],
      minDuration: 5
    })
  }

  const dashboardData = useSpaceDashboard(slug)

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
  } = dashboardData || {}

  const {
    timeHeatmapData,
    productivityTrendData,
    focusTimeDistributionData,
  } = useEnhancedDashboard(slug)

  // Transform data to match component interfaces
  const maxSessions = Math.max(...(timeHeatmapData?.map(item => item.sessions) || [1]));
  const maxDuration = Math.max(...(timeHeatmapData?.map(item => item.totalDuration) || [1]));
  
  const transformedTimeHeatmapData = timeHeatmapData?.map(item => {
    // Calculate intensity based on both session count and duration
    const sessionIntensity = maxSessions > 0 ? item.sessions / maxSessions : 0;
    const durationIntensity = maxDuration > 0 ? item.totalDuration / maxDuration : 0;
    // Weighted average: 60% sessions, 40% duration
    const intensity = (sessionIntensity * 0.6 + durationIntensity * 0.4);
    
    return {
      ...item,
      intensity: Math.min(intensity, 1) // Ensure max value is 1
    };
  }) || []

  const transformedProductivityData = productivityTrendData?.map(item => ({
    date: item.date,
    sessionsCount: item.sessions,
    totalDuration: item.totalDuration,
    averageDuration: item.sessions > 0 ? item.totalDuration / item.sessions : 0,
    focusScore: item.totalDuration > 0 ? Math.round((item.focusTime / item.totalDuration) * 100) : 0,
    completionRate: item.completionRate, // This should be actual task completion rate from backend
    activeMembers: item.activeMembers
  })) || []

  const totalFocusTimeValue = focusTimeDistributionData?.reduce((sum, d) => sum + d.value, 0) || 0;
  
  const transformedFocusTimeData = focusTimeDistributionData?.map(item => {
    // Calculate more realistic session estimates based on actual data
    const averageSessionDuration = 45 * 60 * 1000; // 45 minutes in milliseconds
    const estimatedSessions = Math.max(1, Math.round(item.value / averageSessionDuration));
    const actualAverageLength = estimatedSessions > 0 ? Math.round(item.value / estimatedSessions / (60 * 1000)) : 45; // in minutes
    
    // Calculate focus score based on session length (longer sessions = higher focus)
    const focusScore = Math.min(100, Math.max(20, Math.round((actualAverageLength / 60) * 100)));
    
    return {
      category: item.category,
      duration: item.value,
      percentage: totalFocusTimeValue > 0 ? Math.round((item.value / totalFocusTimeValue) * 100) : 0,
      color: item.color,
      sessions: estimatedSessions,
      averageSessionLength: actualAverageLength,
      focusScore: focusScore
    };
  }) || []

  const totalFocusTime = focusTimeDistributionData?.reduce((sum, item) => sum + item.value, 0) || 0
  
  // Calculate weighted average focus score based on duration
  const averageFocusScore = transformedFocusTimeData.length > 0 ? 
    Math.round(
      transformedFocusTimeData.reduce((sum, item) => sum + (item.focusScore * item.duration), 0) / 
      (totalFocusTime || 1)
    ) : 0

  return (
    <div className='space-y-6'>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-4">
          <DashboardSettings
            sections={visibleSections}
            filters={dashboardFilters}
            onSectionsChange={handleSectionsChange}
            onFiltersChange={handleFiltersChange}
            onResetToDefaults={handleResetToDefaults}
          />
          {spaceData?.space_member && (
            <StatusEditor
              initialStatus={spaceData.space_member.status || 'offline'}
              initialLocation={spaceData.space_member.location || 'remote'}
              slug={slug}
            />
          )}
        </div>
      </div>

      {isSectionVisible('stats') && (
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
      )}

      {/* Active Sessions and Team Members Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Sessions Widget */}
        {isSectionVisible('activeSessions') && (
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
              <ActiveSessionsList
                sessions={spaceActiveSessions || []}
                onStartSession={handleStartSession}
                isStarting={startSessionMutation.isPending}
                hasActiveSession={!!activeSession}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Team Members Widget */}
        {isSectionVisible('teamMembers') && (
          <Collapsible
            open={openSections.teamMembers}
            onOpenChange={(open) => setOpenSections(prev => ({ ...prev, teamMembers: open }))}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.teamMembers && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <TeamMembersCard slug={slug} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {isSectionVisible('sessionActivity') && (
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
        )}

        {isSectionVisible('trackStats') && (
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
        )}
      </div>

      {/* Enhanced Analytics Section */}
      {(isSectionVisible('timeHeatmap') || isSectionVisible('productivityTrend') || isSectionVisible('focusTimeDistribution')) && (
        <div className="space-y-6">
          {/* Time Heatmap and Productivity Trend Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {isSectionVisible('timeHeatmap') && (
              <Collapsible
                open={openSections.timeHeatmap}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, timeHeatmap: open }))}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Activity Heatmap</h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.timeHeatmap && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <TimeHeatmapChart 
                    data={transformedTimeHeatmapData}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            {isSectionVisible('productivityTrend') && (
              <Collapsible
                open={openSections.productivityTrend}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, productivityTrend: open }))}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Productivity Trends</h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.productivityTrend && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <ProductivityTrendChart 
                    data={transformedProductivityData}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Focus Time Distribution - Full Width */}
          {isSectionVisible('focusTimeDistribution') && (
            <Collapsible
              open={openSections.focusTimeDistribution}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, focusTimeDistribution: open }))}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Focus Time Distribution</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.focusTimeDistribution && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <FocusTimeDistribution 
                  data={transformedFocusTimeData} 
                  totalFocusTime={totalFocusTime}
                  averageFocusScore={averageFocusScore}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}
