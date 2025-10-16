import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"
import { useState } from "react"

interface HealthMetric {
  metric: string
  current: number
  target: number
  trend: "up" | "down" | "stable"
  status: "excellent" | "good" | "warning" | "critical"
  description: string
}

interface ProjectHealthRadarProps {
  data: HealthMetric[]
  overallScore: number
  title?: string
  description?: string
  className?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "excellent":
      return { color: "text-green-600", bgColor: "bg-green-100", borderColor: "border-green-200" }
    case "good":
      return { color: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-200" }
    case "warning":
      return { color: "text-yellow-600", bgColor: "bg-yellow-100", borderColor: "border-yellow-200" }
    case "critical":
      return { color: "text-red-600", bgColor: "bg-red-100", borderColor: "border-red-200" }
    default:
      return { color: "text-gray-600", bgColor: "bg-gray-100", borderColor: "border-gray-200" }
  }
}

const getOverallHealthLevel = (score: number) => {
  if (score >= 90) return { label: "Excellent", color: "text-green-600", icon: CheckCircle }
  if (score >= 75) return { label: "Good", color: "text-blue-600", icon: CheckCircle }
  if (score >= 60) return { label: "Fair", color: "text-yellow-600", icon: AlertTriangle }
  return { label: "Needs Attention", color: "text-red-600", icon: AlertTriangle }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3 w-3 text-green-600" />
    case "down":
      return <TrendingDown className="h-3 w-3 text-red-600" />
    default:
      return <div className="h-3 w-3 rounded-full bg-gray-400" />
  }
}

export function ProjectHealthRadar({ 
  data, 
  overallScore,
  title = "Project Health Radar",
  description = "Comprehensive view of project health across key metrics",
  className 
}: ProjectHealthRadarProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  
  const healthLevel = getOverallHealthLevel(overallScore)
  const HealthIcon = healthLevel.icon
  
  // Transform data for radar chart
  const radarData = data.map(metric => ({
    metric: metric.metric,
    current: metric.current,
    target: metric.target,
    fullMark: 100
  }))

  const criticalMetrics = data.filter(m => m.status === "critical").length
  const warningMetrics = data.filter(m => m.status === "warning").length
  const goodMetrics = data.filter(m => m.status === "good" || m.status === "excellent").length

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${healthLevel.color} bg-background border`}>
              <HealthIcon className="h-3 w-3 mr-1" />
              {overallScore}% {healthLevel.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Health Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{overallScore}%</div>
              <div className="text-sm text-muted-foreground">Overall Health</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{goodMetrics}</div>
              <div className="text-sm text-muted-foreground">Healthy Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningMetrics}</div>
              <div className="text-sm text-muted-foreground">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalMetrics}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Health Radar</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 12 }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
                      tickCount={6}
                    />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="#10b981"
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const metric = data.find(m => m.metric === label)
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <div className="space-y-2">
                                <div className="font-medium">{label}</div>
                                {metric && (
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Current:</span>
                                      <span className="font-medium">{metric.current}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Target:</span>
                                      <span className="font-medium">{metric.target}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Status:</span>
                                      <Badge variant="outline" className={getStatusColor(metric.status).bgColor}>
                                        {metric.status}
                                      </Badge>
                                    </div>
                                    <div className="pt-1 text-xs text-muted-foreground">
                                      {metric.description}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Metric Details</h4>
              <div className="space-y-3">
                {data
                  .sort((a, b) => {
                    const statusOrder = { critical: 0, warning: 1, good: 2, excellent: 3 }
                    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
                  })
                  .map((metric) => {
                    const statusStyle = getStatusColor(metric.status)
                    const isSelected = selectedMetric === metric.metric
                    
                    return (
                      <div 
                        key={metric.metric} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        } ${statusStyle.borderColor}`}
                        onClick={() => setSelectedMetric(isSelected ? null : metric.metric)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{metric.metric}</span>
                              {getTrendIcon(metric.trend)}
                            </div>
                            <Badge className={statusStyle.bgColor + " " + statusStyle.color}>
                              {metric.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{metric.current}% / {metric.target}%</span>
                            </div>
                            <Progress 
                              value={metric.current} 
                              className="h-2"
                            />
                          </div>

                          {isSelected && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">
                                {metric.description}
                              </p>
                              <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Current Score:</span>
                                  <div className="font-medium">{metric.current}%</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Target Score:</span>
                                  <div className="font-medium">{metric.target}%</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Action Items */}
          {(criticalMetrics > 0 || warningMetrics > 0) && (
            <div className="pt-4 border-t space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {criticalMetrics > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm font-medium text-red-800">
                      {criticalMetrics} critical metric{criticalMetrics > 1 ? 's' : ''} need immediate attention
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Focus on improving: {data.filter(m => m.status === "critical").map(m => m.metric).join(", ")}
                    </div>
                  </div>
                )}
                {warningMetrics > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">
                      {warningMetrics} metric{warningMetrics > 1 ? 's' : ''} showing warning signs
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      Monitor closely: {data.filter(m => m.status === "warning").map(m => m.metric).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}