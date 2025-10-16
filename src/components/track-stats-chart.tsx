import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { BarChart3, Target } from "lucide-react"
import { useState } from "react"

interface TrackStatsData {
  name: string
  sessions: number
}

interface TrackStatsChartProps {
  data: TrackStatsData[]
  title?: string
  description?: string
  className?: string
}

type SortType = 'sessions' | 'name'

const truncateTrackName = (name: string, maxLength: number = 20) => {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}

export function TrackStatsChart({ 
  data, 
  title = "Track Statistics",
  description = "Session count by track over time",
  className 
}: TrackStatsChartProps) {
  const [sortBy, setSortBy] = useState<SortType>('sessions')
  
  // Sort data based on selected criteria
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'sessions') {
      return b.sessions - a.sessions
    }
    return a.name.localeCompare(b.name)
  })

  // Prepare chart data with truncated names for display
  const chartData = sortedData.map(item => ({
    ...item,
    displayName: truncateTrackName(item.name),
    fullName: item.name
  }))
  
  // Calculate statistics
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0)
  const totalTracks = data.length
  const averageSessions = totalTracks > 0 ? totalSessions / totalTracks : 0
  const topTrack = sortedData.length > 0 ? sortedData[0] : null
  
  // Calculate activity distribution
  const activeTracks = data.filter(d => d.sessions > 0).length
  const inactiveTracks = totalTracks - activeTracks

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; sessions: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            {data.sessions} session{data.sessions !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {totalTracks} tracks
            </Badge>
            <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sessions">By Sessions</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTracks}</div>
              <div className="text-sm text-muted-foreground">Total Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{averageSessions.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg per Track</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activeTracks}</div>
              <div className="text-sm text-muted-foreground">Active Tracks</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                 data={chartData}
                 margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
               >
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="displayName"
                   className="text-muted-foreground"
                   fontSize={12}
                   angle={-45}
                   textAnchor="end"
                   height={60}
                 />
                 <YAxis 
                   className="text-muted-foreground"
                   fontSize={12}
                 />
                 <Tooltip content={<CustomTooltip />} />
                 <Bar 
                   dataKey="sessions" 
                   fill="#10b981" 
                   radius={[2, 2, 0, 0]}
                 />
               </BarChart>
             </ResponsiveContainer>
           </div>

          {/* Top performing track info */}
          {topTrack && topTrack.sessions > 0 && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Most active track: <span className="font-medium text-foreground">
                  {topTrack.name}
                </span> ({topTrack.sessions} sessions)
              </div>
            </div>
          )}

          {/* Activity summary */}
          {totalTracks > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{activeTracks} active</span>
              </div>
              {inactiveTracks > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>{inactiveTracks} inactive</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
