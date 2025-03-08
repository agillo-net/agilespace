"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Import shadcn chart components
import { Bar, BarChart } from "@/components/ui/bar-chart"
import { Line, LineChart } from "@/components/ui/line-chart"
import { Pie, PieChart } from "@/components/ui/pie-chart"
import { Area, AreaChart } from "@/components/ui/area-chart"

// Repository data types
interface RepoData {
  id: number
  name: string
  description: string | null
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
  stargazers_count: number
  forks_count: number
  language: string | null
  open_issues_count: number
  default_branch: string
}

// Chart data types
interface VelocityData {
  sprint: string
  estimated: number
  actual: number
}

interface IssueTypeData {
  type: string
  count: number
  color: string
}

interface EngineerWorkloadData {
  name: string
  coding: number
  review: number
  meetings: number
  documentation: number
}

interface ProductivityData {
  week: string
  coding: number
  meetings: number
}

interface BurndownData {
  date: string
  open: number
  closed: number
}

// Sample colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function RepositoryAnalyticsPage() {
  const { orgName, repoName } = useParams()
  const [repoData, setRepoData] = useState<RepoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Sample chart data
  const [velocityData, setVelocityData] = useState<VelocityData[]>([])
  const [issueTypeData, setIssueTypeData] = useState<IssueTypeData[]>([])
  const [engineerWorkloadData, setEngineerWorkloadData] = useState<EngineerWorkloadData[]>([])
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([])
  const [burndownData, setBurndownData] = useState<BurndownData[]>([])

  // Fetch repository data and generate sample analytics data
  useEffect(() => {
    async function fetchRepoData() {
      if (!orgName || !repoName) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Try to fetch real repository data if API endpoint is available
        try {
          const response = await fetch(`/api/github/org/${orgName}/repo/${repoName}`)
          if (response.ok) {
            const data = await response.json()
            setRepoData(data)
          } else {
            throw new Error('Repository API not available')
          }
        } catch (e) {
          // Fallback to sample data if API fails
          console.log('Using sample repository data')
          setRepoData({
            id: 123456789,
            name: repoName as string,
            description: "Sample repository with analytics data",
            html_url: `https://github.com/${orgName}/${repoName}`,
            owner: {
              login: orgName as string,
              avatar_url: `https://github.com/${orgName}.png`
            },
            stargazers_count: 42,
            forks_count: 13,
            language: "TypeScript",
            open_issues_count: 8,
            default_branch: "main"
          })
        }
        
        // Generate sample data for charts
        generateSampleData()
      } catch (err) {
        console.error('Error fetching repository data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRepoData()
  }, [orgName, repoName])

  // Generate sample data for all charts
  const generateSampleData = () => {
    // Team Velocity data
    const velocitySampleData: VelocityData[] = [
      { sprint: "Sprint 1", estimated: 45, actual: 40 },
      { sprint: "Sprint 2", estimated: 50, actual: 52 },
      { sprint: "Sprint 3", estimated: 55, actual: 48 },
      { sprint: "Sprint 4", estimated: 60, actual: 58 },
      { sprint: "Sprint 5", estimated: 65, actual: 70 },
      { sprint: "Sprint 6", estimated: 70, actual: 68 }
    ]
    setVelocityData(velocitySampleData)
    
    // Issue Type breakdown data
    const issueTypeSampleData: IssueTypeData[] = [
      { type: "Bug", count: 35, color: "#FF8042" },
      { type: "Feature", count: 45, color: "#0088FE" },
      { type: "Documentation", count: 15, color: "#00C49F" },
      { type: "Enhancement", count: 25, color: "#FFBB28" },
      { type: "Test", count: 10, color: "#8884d8" }
    ]
    setIssueTypeData(issueTypeSampleData)
    
    // Engineer workload data
    const engineerSampleData: EngineerWorkloadData[] = [
      { name: "Alex", coding: 35, review: 15, meetings: 10, documentation: 5 },
      { name: "Blake", coding: 25, review: 20, meetings: 15, documentation: 10 },
      { name: "Casey", coding: 40, review: 10, meetings: 12, documentation: 8 },
      { name: "Dana", coding: 30, review: 25, meetings: 8, documentation: 12 },
      { name: "Jamie", coding: 20, review: 30, meetings: 16, documentation: 14 }
    ]
    setEngineerWorkloadData(engineerSampleData)
    
    // Productivity balance data
    const productivitySampleData: ProductivityData[] = [
      { week: "Week 1", coding: 30, meetings: 10 },
      { week: "Week 2", coding: 25, meetings: 15 },
      { week: "Week 3", coding: 35, meetings: 12 },
      { week: "Week 4", coding: 20, meetings: 18 },
      { week: "Week 5", coding: 28, meetings: 14 },
      { week: "Week 6", coding: 32, meetings: 8 }
    ]
    setProductivityData(productivitySampleData)
    
    // Burndown data
    const burndownSampleData: BurndownData[] = [
      { date: "Week 1", open: 25, closed: 5 },
      { date: "Week 2", open: 20, closed: 10 },
      { date: "Week 3", open: 15, closed: 15 },
      { date: "Week 4", open: 12, closed: 18 },
      { date: "Week 5", open: 8, closed: 22 },
      { date: "Week 6", open: 5, closed: 25 }
    ]
    setBurndownData(burndownSampleData)
  }

  if (isLoading) {
    return <RepositorySkeleton />
  }

  if (error || !repoData) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Error Loading Repository</CardTitle>
          <CardDescription>
            We encountered a problem while loading the repository data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error || "Repository not found"}</p>
        </CardContent>
      </Card>
    )
  }

  // Format data for Pie Chart
  const issueTypePieData = issueTypeData.map(({ type, count, color }) => ({
    name: type,
    value: count,
    color
  }));

  // Format data for Productivity Pie Chart
  const productivityPieData = [
    { 
      name: "Coding", 
      value: productivityData.reduce((sum, item) => sum + item.coding, 0),
      color: "#8884d8"
    },
    { 
      name: "Meetings", 
      value: productivityData.reduce((sum, item) => sum + item.meetings, 0),
      color: "#82ca9d"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Repository Header */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 flex-wrap">
          <Avatar className="h-16 w-16">
            <AvatarImage src={repoData.owner.avatar_url} alt={repoData.owner.login} />
            <AvatarFallback>{repoData.owner.login[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{repoData.name}</CardTitle>
            <CardDescription>
              {repoData.description || "No description available"}
            </CardDescription>
            <div className="flex gap-2 mt-2 flex-wrap">
              {repoData.language && (
                <Badge variant="outline">{repoData.language}</Badge>
              )}
              <Badge variant="secondary">⭐ {repoData.stargazers_count}</Badge>
              <Badge variant="secondary">🍴 {repoData.forks_count}</Badge>
              <Badge variant="secondary">🐛 {repoData.open_issues_count}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="velocity">Team Velocity</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="issues">Issue Tracking</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Velocity Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Team Velocity</CardTitle>
                <CardDescription>Estimated vs Actual time per sprint</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <LineChart
                  data={velocityData}
                  categories={["estimated", "actual"]}
                  index="sprint"
                  colors={["indigo", "green"]}
                  valueFormatter={(value) => `${value} hours`}
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </CardContent>
            </Card>
            
            {/* Issue Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Issue Type Breakdown</CardTitle>
                <CardDescription>Distribution of issues by type</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <PieChart
                  data={issueTypePieData}
                  category="value"
                  index="name"
                  valueFormatter={(value) => `${value} issues`}
                  colors={issueTypePieData.map(item => item.color)}
                  className="h-full"
                  showTooltip
                  showLegend
                />
              </CardContent>
            </Card>

            {/* Code vs Meeting Time */}
            <Card>
              <CardHeader>
                <CardTitle>Code vs Meeting Time</CardTitle>
                <CardDescription>Balance between coding and meetings</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <BarChart
                  data={productivityData}
                  categories={["coding", "meetings"]}
                  index="week"
                  colors={["indigo", "green"]}
                  valueFormatter={(value) => `${value} hours`}
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </CardContent>
            </Card>

            {/* Burndown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Burndown Chart</CardTitle>
                <CardDescription>Open vs Closed Issues Over Time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <AreaChart
                  data={burndownData}
                  categories={["open", "closed"]}
                  index="date"
                  colors={["orange", "teal"]}
                  valueFormatter={(value) => `${value} issues`}
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Team Velocity Tab */}
        <TabsContent value="velocity" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Velocity</CardTitle>
              <CardDescription>
                Estimated vs. Actual hours spent per sprint
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <LineChart
                data={velocityData}
                categories={["estimated", "actual"]}
                index="sprint"
                colors={["indigo", "green"]}
                valueFormatter={(value) => `${value} hours`}
                yAxisWidth={40}
                showLegend
                showXAxis
                showYAxis
                showTooltip
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Spent per Engineer</CardTitle>
              <CardDescription>
                Breakdown of time spent by each team member
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <BarChart
                data={engineerWorkloadData}
                categories={["coding", "review", "meetings", "documentation"]}
                index="name"
                colors={["indigo", "green", "amber", "rose"]}
                valueFormatter={(value) => `${value} hours`}
                yAxisWidth={40}
                showLegend
                showXAxis
                showYAxis
                showTooltip
                stack
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Coding vs Meeting Time</CardTitle>
              <CardDescription>
                Balance between coding and meetings across weeks
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <BarChart
                data={productivityData}
                categories={["coding", "meetings"]}
                index="week"
                colors={["indigo", "green"]}
                valueFormatter={(value) => `${value} hours`}
                yAxisWidth={40}
                showLegend
                showXAxis
                showYAxis
                showTooltip
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Productivity Ratio</CardTitle>
              <CardDescription>
                Percentage of time spent on coding vs meetings
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <PieChart
                data={productivityPieData}
                category="value"
                index="name"
                valueFormatter={(value) => `${value} hours`}
                colors={["indigo", "green"]}
                className="h-full"
                showTooltip
                showLegend
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Issue Tracking Tab */}
        <TabsContent value="issues" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Type Breakdown</CardTitle>
                <CardDescription>
                  Distribution of issues by type
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <PieChart
                  data={issueTypePieData}
                  category="value"
                  index="name"
                  valueFormatter={(value) => `${value} issues`}
                  colors={issueTypePieData.map(item => item.color)}
                  className="h-full"
                  showTooltip
                  showLegend
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Burndown Chart</CardTitle>
                <CardDescription>
                  Open vs. Closed Issues Over Time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <AreaChart
                  data={burndownData}
                  categories={["open", "closed"]}
                  index="date"
                  colors={["orange", "teal"]}
                  valueFormatter={(value) => `${value} issues`}
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RepositorySkeleton() {
  return (
    <div className="space-y-8">
      {/* Repository Header Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
