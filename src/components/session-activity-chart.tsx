import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Activity, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { useState } from "react"

interface SessionActivityData {
  date: string
  sessions: number
}

interface SessionActivityChartProps {
  data: SessionActivityData[]
  title?: string
  description?: string
  className?: string
}

type ChartType = 'line' | 'area'

const formatDate = (dateStr: string) => {
  try {
    // Try parsing as ISO date first
    const date = parseISO(dateStr)
    if (isValid(date)) {
      return format(date, 'MMM dd')
    }
    
    // Fallback: try parsing as locale date string
    const fallbackDate = new Date(dateStr)
    if (isValid(fallbackDate)) {
      return format(fallbackDate, 'MMM dd')
    }
    
    // Last resort: return original string
    return dateStr
  } catch {
    return dateStr
  }
}

const calculateTrend = (data: SessionActivityData[]) => {
  if (data.length < 2) return 0
  
  const recent = data.slice(-3).reduce((sum, d) => sum + d.sessions, 0) / Math.min(3, data.length)
  const previous = data.slice(-6, -3).reduce((sum, d) => sum + d.sessions, 0) / Math.min(3, data.length - 3)
  
  if (previous === 0) return recent > 0 ? 100 : 0
  return ((recent - previous) / previous) * 100
}

const getTrendIcon = (trend: number) => {
  if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend < -5) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-gray-500" />
}

const getTrendColor = (trend: number) => {
  if (trend > 5) return "text-green-500"
  if (trend < -5) return "text-red-500"
  return "text-gray-500"
}

export function SessionActivityChart({ 
  data, 
  title = "Session Activity",
  description = "Track daily session activity over time",
  className 
}: SessionActivityChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area')
  
  // Prepare chart data with formatted dates
  const chartData = data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
    originalDate: item.date
  }))
  
  // Calculate statistics
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0)
  const averageSessions = data.length > 0 ? totalSessions / data.length : 0
  const peakSessions = data.length > 0 ? Math.max(...data.map(d => d.sessions)) : 0
  const trend = calculateTrend(data)
  
  // Find peak day
  const peakDay = data.find(d => d.sessions === peakSessions)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { originalDate: string }; value: number }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.originalDate}</p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            {payload[0].value} session{payload[0].value !== 1 ? 's' : ''}
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
              <Activity className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {totalSessions} total sessions
            </Badge>
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="line">Line</SelectItem>
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
              <div className="text-2xl font-bold">{averageSessions.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Daily Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{peakSessions}</div>
              <div className="text-sm text-muted-foreground">Peak Day</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {getTrendIcon(trend)}
                <span className={`text-xl font-bold ${getTrendColor(trend)}`}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">7-day Trend</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="formattedDate" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="formattedDate" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Peak activity info */}
          {peakDay && peakSessions > 0 && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Peak activity: <span className="font-medium text-foreground">
                  {peakDay.date}
                </span> ({peakSessions} sessions)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
