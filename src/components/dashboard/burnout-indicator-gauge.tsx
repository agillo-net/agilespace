import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { 
  Heart, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Users,
  Shield,
  Coffee,
  Moon
} from "lucide-react"
import { useState } from "react"

interface BurnoutFactor {
  factor: string
  score: number
  weight: number
  trend: "improving" | "worsening" | "stable"
  description: string
  recommendation: string
}

interface TeamMemberBurnout {
  memberId: string
  memberName: string
  avatar?: string
  burnoutScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  factors: {
    workload: number
    overtime: number
    breaks: number
    satisfaction: number
  }
}

interface BurnoutIndicatorGaugeProps {
  overallBurnoutScore: number
  factors: BurnoutFactor[]
  teamMembers: TeamMemberBurnout[]
  title?: string
  description?: string
  className?: string
}

const getRiskLevel = (score: number) => {
  if (score <= 25) return { 
    label: "Low Risk", 
    color: "text-green-600", 
    bgColor: "bg-green-100",
    gaugeColor: "#10b981"
  }
  if (score <= 50) return { 
    label: "Medium Risk", 
    color: "text-yellow-600", 
    bgColor: "bg-yellow-100",
    gaugeColor: "#f59e0b"
  }
  if (score <= 75) return { 
    label: "High Risk", 
    color: "text-orange-600", 
    bgColor: "bg-orange-100",
    gaugeColor: "#ea580c"
  }
  return { 
    label: "Critical Risk", 
    color: "text-red-600", 
    bgColor: "bg-red-100",
    gaugeColor: "#dc2626"
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "improving":
      return <TrendingDown className="h-3 w-3 text-green-600" />
    case "worsening":
      return <TrendingUp className="h-3 w-3 text-red-600" />
    default:
      return <div className="h-3 w-3 rounded-full bg-gray-400" />
  }
}

const getFactorIcon = (factor: string) => {
  switch (factor.toLowerCase()) {
    case "workload":
      return <Clock className="h-4 w-4" />
    case "overtime":
      return <Calendar className="h-4 w-4" />
    case "breaks":
      return <Coffee className="h-4 w-4" />
    case "satisfaction":
      return <Heart className="h-4 w-4" />
    case "sleep":
      return <Moon className="h-4 w-4" />
    default:
      return <Shield className="h-4 w-4" />
  }
}

export function BurnoutIndicatorGauge({ 
  overallBurnoutScore, 
  factors,
  teamMembers,
  title = "Burnout Risk Monitor",
  description = "Track team burnout indicators and wellness metrics",
  className 
}: BurnoutIndicatorGaugeProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  
  const riskLevel = getRiskLevel(overallBurnoutScore)
  
  // Create gauge data for visualization
  const gaugeData = [
    { name: "Risk", value: overallBurnoutScore, fill: riskLevel.gaugeColor },
    { name: "Safe", value: 100 - overallBurnoutScore, fill: "#e5e7eb" }
  ]

  const highRiskMembers = teamMembers.filter(m => m.riskLevel === "high" || m.riskLevel === "critical").length
  const mediumRiskMembers = teamMembers.filter(m => m.riskLevel === "medium").length
  const lowRiskMembers = teamMembers.filter(m => m.riskLevel === "low").length

  const worseningFactors = factors.filter(f => f.trend === "worsening")
  const improvingFactors = factors.filter(f => f.trend === "improving")

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${riskLevel.bgColor} ${riskLevel.color} border`}>
              {riskLevel.label}
            </Badge>
            {highRiskMembers > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highRiskMembers} at risk
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className={`text-2xl font-bold ${riskLevel.color}`}>{overallBurnoutScore}%</div>
              <div className="text-sm text-muted-foreground">Burnout Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{lowRiskMembers}</div>
              <div className="text-sm text-muted-foreground">Low Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{mediumRiskMembers}</div>
              <div className="text-sm text-muted-foreground">Medium Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{highRiskMembers}</div>
              <div className="text-sm text-muted-foreground">High Risk</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Burnout Gauge */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Risk Level Gauge</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecommendations(!showRecommendations)}
                >
                  {showRecommendations ? "Hide" : "Show"} Recommendations
                </Button>
              </div>
              
              <div className="relative">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {gaugeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="text-sm font-medium">
                                  {data.name}: {data.value}%
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gauge center display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${riskLevel.color}`}>
                      {overallBurnoutScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {riskLevel.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Contributing Factors</h5>
                {factors
                  .sort((a, b) => b.score * b.weight - a.score * a.weight)
                  .map((factor) => (
                    <div key={factor.factor} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFactorIcon(factor.factor)}
                          <span className="font-medium">{factor.factor}</span>
                          {getTrendIcon(factor.trend)}
                        </div>
                        <Badge variant="outline">
                          {factor.score}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Impact Level</span>
                          <span className="font-medium">Weight: {factor.weight}</span>
                        </div>
                        <Progress value={factor.score} className="h-2" />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {factor.description}
                      </div>

                      {showRecommendations && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium text-blue-600">
                            Recommendation:
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {factor.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Team Member Risk Levels */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Individual Risk Assessment
              </h4>
              
              <div className="space-y-3">
                {teamMembers
                  .sort((a, b) => b.burnoutScore - a.burnoutScore)
                  .map((member) => {
                    const memberRisk = getRiskLevel(member.burnoutScore)
                    const isSelected = selectedMember === member.memberId
                    
                    return (
                      <div 
                        key={member.memberId}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedMember(isSelected ? null : member.memberId)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {member.memberName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{member.memberName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Risk Score: {member.burnoutScore}%
                                </div>
                              </div>
                            </div>
                            <Badge className={`${memberRisk.bgColor} ${memberRisk.color}`}>
                              {member.riskLevel}
                            </Badge>
                          </div>
                          
                          <Progress value={member.burnoutScore} className="h-2" />

                          {isSelected && (
                            <div className="pt-2 border-t space-y-2">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Workload:</span>
                                  <div className="font-medium">{member.factors.workload}%</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Overtime:</span>
                                  <div className="font-medium">{member.factors.overtime}%</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Breaks:</span>
                                  <div className="font-medium">{member.factors.breaks}%</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Satisfaction:</span>
                                  <div className="font-medium">{member.factors.satisfaction}%</div>
                                </div>
                              </div>
                              
                              {member.riskLevel === "high" || member.riskLevel === "critical" ? (
                                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                                  <div className="font-medium text-red-800">Action Required</div>
                                  <div className="text-red-600">
                                    Consider reducing workload and scheduling a wellness check-in
                                  </div>
                                </div>
                              ) : member.riskLevel === "medium" ? (
                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                  <div className="font-medium text-yellow-800">Monitor Closely</div>
                                  <div className="text-yellow-600">
                                    Keep an eye on workload and encourage regular breaks
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                                  <div className="font-medium text-green-800">Healthy Status</div>
                                  <div className="text-green-600">
                                    Maintain current work-life balance practices
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          {(worseningFactors.length > 0 || improvingFactors.length > 0) && (
            <div className="pt-4 border-t space-y-3">
              <h4 className="text-sm font-medium">Trend Analysis</h4>
              
              {worseningFactors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Worsening Factors ({worseningFactors.length})
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {worseningFactors.map(f => f.factor).join(", ")} - require immediate attention
                  </div>
                </div>
              )}
              
              {improvingFactors.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Improving Factors ({improvingFactors.length})
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {improvingFactors.map(f => f.factor).join(", ")} - positive trends to maintain
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}