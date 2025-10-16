import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, TrendingUp } from "lucide-react"

interface TimeHeatmapData {
  hour: number
  day: number
  sessions: number
  totalDuration: number
  intensity: number
}

interface TimeHeatmapChartProps {
  data: TimeHeatmapData[]
  title?: string
  description?: string
  className?: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const getIntensityColor = (intensity: number) => {
  if (intensity === 0) return 'bg-muted'
  if (intensity <= 0.2) return 'bg-blue-100 dark:bg-blue-900/20'
  if (intensity <= 0.4) return 'bg-blue-200 dark:bg-blue-800/40'
  if (intensity <= 0.6) return 'bg-blue-300 dark:bg-blue-700/60'
  if (intensity <= 0.8) return 'bg-blue-400 dark:bg-blue-600/80'
  return 'bg-blue-500 dark:bg-blue-500'
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

export function TimeHeatmapChart({
  data,
  title = "Team Activity Heatmap",
  description = "Visual representation of team activity patterns throughout the week",
  className
}: TimeHeatmapChartProps) {
  // Create a map for quick lookup
  const dataMap = new Map<string, TimeHeatmapData>()
  data.forEach(item => {
    dataMap.set(`${item.day}-${item.hour}`, item)
  })

  // Calculate peak activity stats
  const peakHour = data.length > 0
    ? data.reduce((prev, current) =>
        prev.sessions > current.sessions ? prev : current
      )
    : null
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0)

  return (
    <TooltipProvider>
      <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {totalSessions} sessions
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                <div
                  key={intensity}
                  className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-1">
            {/* Hour labels */}
            <div className="flex">
              <div className="w-8" /> {/* Space for day labels */}
              {HOURS.filter((_, i) => i % 4 === 0).map(hour => (
                <div key={hour} className="w-4 text-xs text-muted-foreground text-center">
                  {hour}
                </div>
              ))}
            </div>

            {/* Days and activity grid */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1">
                <div className="w-8 text-xs text-muted-foreground text-right pr-2">
                  {day}
                </div>
                <div className="flex gap-1">
                  {HOURS.map(hour => {
                    const cellData = dataMap.get(`${dayIndex}-${hour}`)
                    const sessions = cellData?.sessions || 0
                    const duration = cellData?.totalDuration || 0
                    const intensity = cellData?.intensity || 0

                    return (
                      <Tooltip key={hour}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${getIntensityColor(intensity)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">
                              {day} {hour}:00 - {hour + 1}:00
                            </div>
                            <div className="text-muted-foreground">
                              {sessions} session{sessions !== 1 ? 's' : ''}
                            </div>
                            {duration > 0 && (
                              <div className="text-muted-foreground">
                                {formatDuration(duration)} total
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Peak activity info */}
          {peakHour && peakHour.sessions > 0 && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Peak activity: <span className="font-medium text-foreground">
                  {DAYS[peakHour.day]} {peakHour.hour}:00-{peakHour.hour + 1}:00
                </span> ({peakHour.sessions} sessions)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}