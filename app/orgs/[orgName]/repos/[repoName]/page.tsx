"use client"

import { useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRepositoryStore } from "@/store/repository-store"
import { fetchRepositoryDetails } from "@/lib/api-services"

// Import shadcn chart components
import { BarChart } from "@/components/ui/bar-chart"
import { LineChart } from "@/components/ui/line-chart"
import { PieChart } from "@/components/ui/pie-chart"
import { AreaChart } from "@/components/ui/area-chart"

export default function RepositoryAnalyticsPage() {
  const { orgName, repoName } = useParams()
  const { 
    repository,
    isLoadingRepository,
    repositoryError,
    velocityData,
    issueTypeData,
    engineerWorkloadData,
    productivityData,
    burndownData,
    setRepository,
    setIsLoadingRepository,
    setRepositoryError,
    generateSampleAnalyticsData,
    resetState
  } = useRepositoryStore()

  // Fetch repository data and generate sample analytics data
  useEffect(() => {
    async function fetchRepoData() {
      if (!orgName || !repoName || typeof orgName !== 'string' || typeof repoName !== 'string') return
      
      setIsLoadingRepository(true)
      setRepositoryError(null)
      
      try {
        // Try to fetch real repository data
        try {
          const data = await fetchRepositoryDetails(orgName, repoName)
          setRepository(data)
        } catch {
          // Fallback to sample data if API fails
          console.log('Using sample repository data')
          setRepository({
            id: 123456789,
            name: repoName,
            description: "Sample repository with analytics data",
            html_url: `https://github.com/${orgName}/${repoName}`,
            owner: {
              login: orgName,
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
        generateSampleAnalyticsData()
      } catch (err) {
        console.error('Error fetching repository data:', err)
        setRepositoryError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsLoadingRepository(false)
      }
    }
    
    fetchRepoData()
    
    // Cleanup function to reset state when component unmounts
    return () => { resetState() }
  }, [orgName, repoName, setIsLoadingRepository, setRepository, setRepositoryError, generateSampleAnalyticsData, resetState])

  // Format data for Pie Chart
  const issueTypePieData = useMemo(() => {
    return issueTypeData.map(({ type, count, color }) => ({
      name: type,
      value: count,
      color
    }))
  }, [issueTypeData])

  // Format data for Productivity Pie Chart
  const productivityPieData = useMemo(() => {
    return [
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
    ]
  }, [productivityData])

  if (isLoadingRepository) {
    return <RepositorySkeleton />
  }

  if (repositoryError || !repository) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Error Loading Repository</CardTitle>
          <CardDescription>
            We encountered a problem while loading the repository data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{repositoryError || "Repository not found"}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Repository Header */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 flex-wrap">
          <Avatar className="h-16 w-16">
            <AvatarImage src={repository.owner.avatar_url} alt={repository.owner.login} />
            <AvatarFallback>{repository.owner.login[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{repository.name}</CardTitle>
            <CardDescription>
              {repository.description || "No description available"}
            </CardDescription>
            <div className="flex gap-2 mt-2 flex-wrap">
              {repository.language && (
                <Badge variant="outline">{repository.language}</Badge>
              )}
              <Badge variant="secondary">⭐ {repository.stargazers_count}</Badge>
              <Badge variant="secondary">🍴 {repository.forks_count}</Badge>
              <Badge variant="secondary">🐛 {repository.open_issues_count}</Badge>
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
