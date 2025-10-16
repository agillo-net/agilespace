import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useState } from "react"

interface ProductivityData {
  date: string
  sessionsCount: number
  totalDuration: number
  averageDuration: number
  focusScore: number
  completionRate: number
  activeMembers: number
}

interface ProductivityTrendChartProps {
  data: ProductivityData[]
  title?: string
  description?: string
  className?: string
}

type MetricType = 'sessions' | 'duration' | 'focus' | 'completion' | 'members'

const METRICS = {
  sessions: {
    label: 'Sessions',
    key: 'sessionsCount',
    color: '#3b82f6',
    unit: '',
    format: (value: number) => value.toString()
  },
  duration: {
    label: 'Total Duration',
    key: 'totalDuration',
    color: '#10b981',
    unit: 'h',
    format: (value: number) => `${(value / (1000 * 60 * 60)).toFixed(1)}h` // Convert milliseconds to hours
  },
  focus: {
    label: 'Focus Score',
    key: 'focusScore',
    color: '#f59e0b',
    unit: '%',
    format: (value: number) => `${value}%`
  },
  completion: {
    label: 'Completion Rate',
    key: 'completionRate',
    color: '#8b5cf6',
    unit: '%',
    format: (value: number) => `${value}%`
  },
  members: {
    label: 'Active Members',
    key: 'activeMembers',
    color: '#ef4444',
    unit: '',
    format: (value: number) => value.toString()
  }
} as const

const calculateTrend = (data: ProductivityData[], metric: MetricType) => {
  if (data.length < 2) return 0
  
  const key = METRICS[metric].key as keyof ProductivityData
  const recent = data.slice(-7) // Last 7 days
  const previous = data.slice(-14, -7) // Previous 7 days
  
  if (recent.length === 0 || previous.length === 0) return 0
  
  const recentAvg = recent.reduce((sum, d) => sum + (d[key] as number), 0) / recent.length
  const previousAvg = previous.reduce((sum, d) => sum + (d[key] as number), 0) / previous.length
  
  if (previousAvg === 0) return 0
  return ((recentAvg - previousAvg) / previousAvg) * 100
}

const getTrendIcon = (trend: number) => {
  if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend < -5) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

const getTrendColor = (trend: number) => {
  if (trend > 5) return "text-green-500"
  if (trend < -5) return "text-red-500"
  return "text-muted-foreground"
}

export function ProductivityTrendChart({ 
  data, 
  title = "Productivity Trends",
  description = "Track team productivity metrics over time",
  className 
}: ProductivityTrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('sessions')
  
  const metric = METRICS[selectedMetric]
  const trend = calculateTrend(data, selectedMetric)
  
  // Prepare chart data
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    value: item[metric.key as keyof ProductivityData] as number
  }))

  // Calculate current period stats
  const currentValue = data.length > 0 ? data[data.length - 1][metric.key as keyof ProductivityData] as number : 0
  const averageValue = data.length > 0 ? 
    data.reduce((sum, d) => sum + (d[metric.key as keyof ProductivityData] as number), 0) / data.length : 0

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
          <Select value={selectedMetric} onValueChange={(value: MetricType) => setSelectedMetric(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METRICS).map(([key, metric]) => (
                <SelectItem key={key} value={key}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="text-2xl font-bold">{metric.format(currentValue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-2xl font-bold">{metric.format(averageValue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">7-day trend</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(trend)}
                <span className={`text-lg font-semibold ${getTrendColor(trend)}`}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={metric.format}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Date
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {label}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {metric.label}
                              </span>
                              <span className="font-bold" style={{ color: metric.color }}>
                                {metric.format(payload[0].value as number)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={metric.color}
                  fill={metric.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trend insights */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge variant={trend > 5 ? "default" : trend < -5 ? "destructive" : "secondary"}>
                {trend > 5 ? "Improving" : trend < -5 ? "Declining" : "Stable"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Math.abs(trend).toFixed(1)}% change from previous week
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}