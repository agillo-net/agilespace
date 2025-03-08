"use client"

import { Cell, Legend, Pie, PieChart as BasePieChart, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

export interface PieChartProps {
  data: any[]
  index: string
  category: string
  colors?: string[]
  className?: string
  showLegend?: boolean
  showTooltip?: boolean
  valueFormatter?: (value: number) => string
}

export function PieChart({
  data,
  index,
  category,
  colors = ["blue", "green", "yellow", "red", "purple", "indigo", "pink", "orange"],
  className,
  showLegend = true,
  showTooltip = true,
  valueFormatter = (value: number) => `${value}`,
}: PieChartProps) {
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

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index: idx }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BasePieChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
              verticalAlign="bottom"
              formatter={(value: string) => <span className="text-sm">{value}</span>}
            />
          )}
          <Pie
            data={data}
            dataKey={category}
            nameKey={index}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || getColor(entry[category], index)} />
            ))}
          </Pie>
        </BasePieChart>
      </ResponsiveContainer>
    </div>
  )
}
