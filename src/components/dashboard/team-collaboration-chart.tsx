import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Users, GitBranch, MessageSquare, Clock } from "lucide-react"

interface CollaborationData {
  memberId: string
  memberName: string
  memberAvatar?: string
  sessionsCount: number
  totalDuration: number
  collaborations: {
    partnerId: string
    partnerName: string
    partnerAvatar?: string
    sharedSessions: number
    sharedDuration: number
    collaborationScore: number
  }[]
  communicationScore: number
  availabilityScore: number
  responseTime: number // in minutes
}

interface TeamCollaborationChartProps {
  data: CollaborationData[]
  title?: string
  description?: string
  className?: string
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

const getCollaborationLevel = (score: number) => {
  if (score >= 80) return { label: "Excellent", color: "bg-green-500" }
  if (score >= 60) return { label: "Good", color: "bg-blue-500" }
  if (score >= 40) return { label: "Fair", color: "bg-yellow-500" }
  return { label: "Needs Improvement", color: "bg-red-500" }
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TeamCollaborationChart({ 
  data, 
  title = "Team Collaboration",
  description = "Analyze team member interactions and collaboration patterns",
  className 
}: TeamCollaborationChartProps) {
  // Calculate overall team stats
  const totalMembers = data.length
  const averageCollaboration = data.reduce((sum, member) => {
    const avgScore = member.collaborations.reduce((s, c) => s + c.collaborationScore, 0) / 
                    (member.collaborations.length || 1)
    return sum + avgScore
  }, 0) / (totalMembers || 1)

  const mostCollaborative = data.reduce((prev, current) => {
    const prevAvg = prev.collaborations.reduce((s, c) => s + c.collaborationScore, 0) / 
                   (prev.collaborations.length || 1)
    const currentAvg = current.collaborations.reduce((s, c) => s + c.collaborationScore, 0) / 
                      (current.collaborations.length || 1)
    return currentAvg > prevAvg ? current : prev
  }, data[0])

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {totalMembers} members
            </Badge>
            <Badge variant="outline">
              {averageCollaboration.toFixed(0)}% avg collaboration
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalMembers}</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{averageCollaboration.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Avg Collaboration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {data.reduce((sum, m) => sum + m.collaborations.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Connections</div>
            </div>
          </div>

          {/* Member Collaboration Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Member Collaboration Scores</h4>
            {data.map((member) => {
              const avgCollaboration = member.collaborations.reduce((s, c) => s + c.collaborationScore, 0) / 
                                     (member.collaborations.length || 1)
              const level = getCollaborationLevel(avgCollaboration)

              return (
                <div key={member.memberId} className="space-y-3 p-4 border rounded-lg">
                  {/* Member Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.memberAvatar} />
                        <AvatarFallback>{getInitials(member.memberName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.memberName}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.sessionsCount} sessions • {formatDuration(member.totalDuration)}
                        </div>
                      </div>
                    </div>
                    <Badge className={level.color}>
                      {level.label}
                    </Badge>
                  </div>

                  {/* Collaboration Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <GitBranch className="h-4 w-4" />
                        <span>Collaboration Score</span>
                      </div>
                      <Progress value={avgCollaboration} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {avgCollaboration.toFixed(0)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4" />
                        <span>Communication</span>
                      </div>
                      <Progress value={member.communicationScore} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {member.communicationScore}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Availability</span>
                      </div>
                      <Progress value={member.availabilityScore} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {member.availabilityScore}% • {member.responseTime}min avg response
                      </div>
                    </div>
                  </div>

                  {/* Collaboration Partners */}
                  {member.collaborations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Top Collaborations</div>
                      <div className="flex flex-wrap gap-2">
                        {member.collaborations
                          .sort((a, b) => b.collaborationScore - a.collaborationScore)
                          .slice(0, 5)
                          .map((collab) => (
                            <TooltipProvider key={collab.partnerId}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={collab.partnerAvatar} />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(collab.partnerName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{collab.partnerName}</span>
                                    <Badge variant="secondary" className="text-xs px-1">
                                      {collab.collaborationScore}%
                                    </Badge>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <div className="font-medium">{collab.partnerName}</div>
                                    <div className="text-muted-foreground">
                                      {collab.sharedSessions} shared sessions
                                    </div>
                                    <div className="text-muted-foreground">
                                      {formatDuration(collab.sharedDuration)} together
                                    </div>
                                    <div className="text-muted-foreground">
                                      {collab.collaborationScore}% collaboration score
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Top Collaborator Highlight */}
          {mostCollaborative && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  Most collaborative member: <span className="font-medium text-foreground">
                    {mostCollaborative.memberName}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}