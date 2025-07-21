import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatTime } from '@/lib/utils'
import { useSpaceMembers } from '@/hooks/api/use-space-members'

interface TeamMembersCardProps {
  slug: string
}

export function TeamMembersCard({ slug }: TeamMembersCardProps) {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("today")
  const { members, isLoading, activeSessions } = useSpaceMembers(slug, timeFilter)

  // 8 hours in milliseconds
  const DAILY_GOAL_MS = 8 * 60 * 60 * 1000
  const WEEKLY_GOAL_MS = 5 * DAILY_GOAL_MS // 5 working days
  const MONTHLY_GOAL_MS = 22 * DAILY_GOAL_MS // ~22 working days per month

  const getGoalForFilter = (filter: string) => {
    switch (filter) {
      case "today": return DAILY_GOAL_MS
      case "week": return WEEKLY_GOAL_MS
      case "month": return MONTHLY_GOAL_MS
      default: return DAILY_GOAL_MS
    }
  }


  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Team Members</CardTitle>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const goal = getGoalForFilter(timeFilter)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-medium">Team Members</CardTitle>
          <Link to="/space/$slug/members" params={{ slug }}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <Select value={timeFilter} onValueChange={(value: "today" | "week" | "month") => setTimeFilter(value)}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        {members && members.length > 0 ? (
          members.map(({ member, profile, timeWorked }) => {
            const name = profile?.full_name || 'Unknown'
            const avatarUrl = profile?.avatar_url || `https://www.gravatar.com/avatar/${btoa(name.trim().toLowerCase())}`
            const avatarFallback = name.slice(0, 2).toUpperCase()
            
            // Find active session for this member
            const activeSession = activeSessions?.find(session => session?.space_member.user_id === member.user_id)
            
            // Calculate active session duration if applicable
            const activeSessionTime = activeSession 
              ? Date.now() - new Date(activeSession.started_at).getTime()
              : 0
            
            // Calculate progress percentages
            const completedProgressPercentage = Math.min((timeWorked / goal) * 100, 200) // Cap at 200% for visual purposes
            const activeSessionProgressPercentage = Math.min((activeSessionTime / goal) * 100, 200)
            const totalProgressPercentage = Math.min(((timeWorked + activeSessionTime) / goal) * 100, 200)

            return (
              <div key={member.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  {activeSession && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{name}</span>
                    <div className="flex items-center gap-2">
                      {activeSession && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs px-1">
                          Active
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {timeWorked > 0 ? formatTime(timeWorked) : '0h 0m'}
                        {activeSessionTime > 0 && (
                          <span className="text-blue-600 ml-1">
                            (+{formatTime(activeSessionTime)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={Math.min(completedProgressPercentage, 100)} 
                      className="h-2"
                    />
                    {activeSessionTime > 0 && (
                      <div 
                        className="absolute top-0 h-2 rounded-full bg-blue-400 opacity-60"
                        style={{ 
                          left: `${Math.min(completedProgressPercentage, 100)}%`,
                          width: `${Math.min(activeSessionProgressPercentage, 100 - Math.min(completedProgressPercentage, 100))}%`
                        }}
                      />
                    )}
                    {totalProgressPercentage > 100 && (
                      <div 
                        className="absolute top-0 left-0 h-2 rounded-full bg-red-500 opacity-60"
                        style={{ width: `${Math.min((totalProgressPercentage - 100), 100)}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No team members found
          </div>
        )}
      </CardContent>
    </Card>
  )
}