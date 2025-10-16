import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Play, 
  Pause, 
  Square, 
  Users, 
  MessageSquare, 
  GitCommit,
  Calendar,
  Filter,
  RefreshCw,
  Activity
} from "lucide-react"
import { useState, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"

interface ActivityEvent {
  id: string
  type: "session_start" | "session_pause" | "session_end" | "member_join" | "member_leave" | "comment" | "commit" | "milestone"
  timestamp: Date
  memberId: string
  memberName: string
  memberAvatar?: string
  title: string
  description: string
  metadata?: {
    sessionId?: string
    trackName?: string
    duration?: number
    commitHash?: string
    repositoryName?: string
    commentText?: string
    milestoneTitle?: string
  }
}

interface ActivityTimelineProps {
  events: ActivityEvent[]
  isLive?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  title?: string
  description?: string
  className?: string
  onRefresh?: () => void
}

const getEventIcon = (type: string) => {
  switch (type) {
    case "session_start":
      return <Play className="h-3 w-3 text-green-600" />
    case "session_pause":
      return <Pause className="h-3 w-3 text-yellow-600" />
    case "session_end":
      return <Square className="h-3 w-3 text-red-600" />
    case "member_join":
      return <Users className="h-3 w-3 text-blue-600" />
    case "member_leave":
      return <Users className="h-3 w-3 text-gray-600" />
    case "comment":
      return <MessageSquare className="h-3 w-3 text-purple-600" />
    case "commit":
      return <GitCommit className="h-3 w-3 text-orange-600" />
    case "milestone":
      return <Calendar className="h-3 w-3 text-indigo-600" />
    default:
      return <Activity className="h-3 w-3 text-gray-600" />
  }
}

const getEventColor = (type: string) => {
  switch (type) {
    case "session_start":
      return "border-green-200 bg-green-50"
    case "session_pause":
      return "border-yellow-200 bg-yellow-50"
    case "session_end":
      return "border-red-200 bg-red-50"
    case "member_join":
      return "border-blue-200 bg-blue-50"
    case "member_leave":
      return "border-gray-200 bg-gray-50"
    case "comment":
      return "border-purple-200 bg-purple-50"
    case "commit":
      return "border-orange-200 bg-orange-50"
    case "milestone":
      return "border-indigo-200 bg-indigo-50"
    default:
      return "border-gray-200 bg-gray-50"
  }
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

export function ActivityTimeline({ 
  events,
  isLive = false,
  autoRefresh = false,
  refreshInterval = 30000,
  title = "Activity Timeline",
  description = "Real-time team activity and events",
  className,
  onRefresh
}: ActivityTimelineProps) {
  const [filteredEvents, setFilteredEvents] = useState(events)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const eventTypes = [
    { value: "all", label: "All Events" },
    { value: "session_start", label: "Session Start" },
    { value: "session_pause", label: "Session Pause" },
    { value: "session_end", label: "Session End" },
    { value: "member_join", label: "Member Join" },
    { value: "member_leave", label: "Member Leave" },
    { value: "comment", label: "Comments" },
    { value: "commit", label: "Commits" },
    { value: "milestone", label: "Milestones" }
  ]

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        handleRefresh()
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, onRefresh])

  // Filter events based on selected filter
  useEffect(() => {
    if (selectedFilter === "all") {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter(event => event.type === selectedFilter))
    }
  }, [events, selectedFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (onRefresh) {
      await onRefresh()
    }
    setLastRefresh(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter)
  }

  const groupEventsByDate = (events: ActivityEvent[]) => {
    const groups: { [key: string]: ActivityEvent[] } = {}
    
    events.forEach(event => {
      const dateKey = format(event.timestamp, "yyyy-MM-dd")
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })
    
    return groups
  }

  const eventGroups = groupEventsByDate(filteredEvents)
  const sortedDates = Object.keys(eventGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const todayEvents = filteredEvents.filter(event => 
    format(event.timestamp, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ).length

  const activeMembers = new Set(
    filteredEvents
      .filter(event => event.type === "session_start" || event.type === "member_join")
      .map(event => event.memberId)
  ).size

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {title}
              {isLive && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{todayEvents}</div>
              <div className="text-sm text-muted-foreground">Today's Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activeMembers}</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredEvents.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
            {eventTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>

          {/* Timeline */}
          <ScrollArea className="h-96">
            <div className="space-y-6">
              {sortedDates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div>No events found</div>
                  <div className="text-sm">Try adjusting your filters</div>
                </div>
              ) : (
                sortedDates.map((date) => (
                  <div key={date} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                      <div className="text-sm font-medium">
                        {format(new Date(date), "EEEE, MMMM d, yyyy")}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      <Badge variant="secondary">
                        {eventGroups[date].length} events
                      </Badge>
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-3 pl-4">
                      {eventGroups[date]
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((event) => (
                          <div key={event.id} className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                            
                            {/* Event card */}
                            <div className={`relative flex gap-3 p-3 rounded-lg border ${getEventColor(event.type)}`}>
                              {/* Timeline dot */}
                              <div className="absolute -left-1 top-4 w-2 h-2 bg-background border-2 border-current rounded-full" />
                              
                              {/* Event icon */}
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center">
                                {getEventIcon(event.type)}
                              </div>

                              {/* Event content */}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="font-medium">{event.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {event.description}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                                  </div>
                                </div>

                                {/* Member info */}
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={event.memberAvatar} />
                                    <AvatarFallback className="text-xs">
                                      {event.memberName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">{event.memberName}</span>
                                </div>

                                {/* Event metadata */}
                                {event.metadata && (
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {event.metadata.trackName && (
                                      <div>Track: <span className="font-medium">{event.metadata.trackName}</span></div>
                                    )}
                                    {event.metadata.duration && (
                                      <div>Duration: <span className="font-medium">{formatDuration(event.metadata.duration)}</span></div>
                                    )}
                                    {event.metadata.commitHash && (
                                      <div>
                                        Commit: <span className="font-mono">{event.metadata.commitHash.substring(0, 7)}</span>
                                        {event.metadata.repositoryName && (
                                          <span> in {event.metadata.repositoryName}</span>
                                        )}
                                      </div>
                                    )}
                                    {event.metadata.commentText && (
                                      <div className="italic">"{event.metadata.commentText}"</div>
                                    )}
                                    {event.metadata.milestoneTitle && (
                                      <div>Milestone: <span className="font-medium">{event.metadata.milestoneTitle}</span></div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Last refresh info */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated: {format(lastRefresh, "HH:mm:ss")}
            {autoRefresh && (
              <span> • Auto-refresh every {Math.floor(refreshInterval / 1000)}s</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}