"use client"

import { Area, AreaChart as BaseAreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"

export interface AreaChartProps {
  data: ChartData[]
  index: string
  categories: string[]
  colors?: string[]
  className?: string
  yAxisWidth?: number
  showXAxis?: boolean
  showYAxis?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showCartesianGrid?: boolean
  valueFormatter?: (value: number) => string
}

interface ChartData {
  [key: string]: string | number;
}

export function AreaChart({
  data = [],
  index,
  categories,
  colors = ["blue", "green", "yellow", "red", "purple", "indigo", "pink", "orange"],
  className,
  yAxisWidth = 56,
  showXAxis = true,
  showYAxis = true,
  showLegend = true,
  showTooltip = true,
  showCartesianGrid = true,
  valueFormatter = (value: number) => `${value}`,
}: AreaChartProps) {
  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
    purple: "#a855f7",
    indigo: "#6366f1",
    pink: "#ec4899",
    orange: "#f97316",
    teal: "#14b8a6",
    cyan: "#06b6d4",
    lime: "#84cc16",
    amber: "#f59e0b",
  }

  const getColor = (category: string, index: number) => {
    const color = colors[index % colors.length]
    return colorMap[color] || color
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BaseAreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          {showCartesianGrid && <CartesianGrid strokeDasharray="3 3" />}
          {showXAxis && <XAxis dataKey={index} />}
          {showYAxis && <YAxis width={yAxisWidth} />}
          {showTooltip && (
            <Tooltip
              formatter={(value: number, name: string) => [
                valueFormatter(value),
                name,
              ]}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) => <span className="text-sm">{value}</span>}
            />
          )}
          {categories.map((category, i) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={getColor(category, i)}
              fill={getColor(category, i)}
              fillOpacity={0.3}
              stackId={1}
            />
          ))}
        </BaseAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
