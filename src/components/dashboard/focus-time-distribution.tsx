import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Focus, Clock, Target, TrendingUp } from "lucide-react"
import { useState } from "react"

interface FocusTimeData {
  category: string
  duration: number
  percentage: number
  color: string
  sessions: number
  averageSessionLength: number
  focusScore: number
}

interface FocusTimeDistributionProps {
  data: FocusTimeData[]
  totalFocusTime: number
  averageFocusScore: number
  title?: string
  description?: string
  className?: string
}

const formatDuration = (milliseconds: number) => {
  const totalMinutes = Math.floor(milliseconds / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

const getFocusLevel = (score: number) => {
  if (score >= 80) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" }
  if (score >= 60) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" }
  if (score >= 40) return { label: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" }
  return { label: "Needs Focus", color: "text-red-600", bgColor: "bg-red-100" }
}

export function FocusTimeDistribution({ 
  data, 
  totalFocusTime,
  averageFocusScore,
  title = "Focus Time Distribution",
  description = "Breakdown of how team focus time is distributed across activities",
  className 
}: FocusTimeDistributionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  
  const focusLevel = getFocusLevel(averageFocusScore)
  const totalSessions = data.reduce((sum, item) => sum + item.sessions, 0)
  const mostFocusedCategory = data.length > 0 ? data.reduce((prev, current) => 
    prev.focusScore > current.focusScore ? prev : current
  ) : null

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Focus className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(totalFocusTime)}
            </Badge>
            <Badge className={focusLevel.bgColor + " " + focusLevel.color}>
              {averageFocusScore}% focus
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(totalFocusTime)}</div>
              <div className="text-sm text-muted-foreground">Total Focus Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSessions}</div>
              <div className="text-sm text-muted-foreground">Focus Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{averageFocusScore}%</div>
              <div className="text-sm text-muted-foreground">Avg Focus Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Time Distribution</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="duration"
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={activeIndex === index ? "#000" : "none"}
                          strokeWidth={activeIndex === index ? 2 : 0}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as FocusTimeData
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <div className="space-y-2">
                                <div className="font-medium">{data.category}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Duration:</span>
                                    <div className="font-medium">{formatDuration(data.duration)}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Percentage:</span>
                                    <div className="font-medium">{data.percentage.toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Sessions:</span>
                                    <div className="font-medium">{data.sessions}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Focus Score:</span>
                                    <div className="font-medium">{data.focusScore}%</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Category Breakdown</h4>
              <div className="space-y-3">
                {data
                  .sort((a, b) => b.duration - a.duration)
                  .map((category) => (
                    <div key={category.category} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <Badge variant="outline">
                          {category.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <div className="font-medium">{formatDuration(category.duration)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sessions:</span>
                          <div className="font-medium">{category.sessions}</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Focus Score</span>
                          <span className="font-medium">{category.focusScore}%</span>
                        </div>
                        <Progress value={category.focusScore} className="h-2" />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Avg session: {formatDuration(category.averageSessionLength)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="pt-4 border-t space-y-3">
            {mostFocusedCategory && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Most focused category: <span className="font-medium text-foreground">
                    {mostFocusedCategory.category}
                  </span> ({mostFocusedCategory.focusScore}% focus score)
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Overall focus level: <span className={`font-medium ${focusLevel.color}`}>
                  {focusLevel.label}
                </span> ({averageFocusScore}% average)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}