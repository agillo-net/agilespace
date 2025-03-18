'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchOrganizationTeams } from '@/lib/api-services'
import { useGithubStore } from '@/store/github-store'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function TeamsPage() {
  const router = useRouter()
  const params = useParams()
  const { orgName } = params as { orgName: string }
  
  const { 
    teams,
    isLoadingOrgResources,
    orgResourcesError,
    setTeams,
    setIsLoadingOrgResources,
    setOrgResourcesError
  } = useGithubStore()

  useEffect(() => {
    const loadTeams = async () => {
      setIsLoadingOrgResources(true)
      setOrgResourcesError(null)
      
      try {
        const teamsData = await fetchOrganizationTeams(orgName)
        setTeams(teamsData)
      } catch (error) {
        console.error('Failed to load teams:', error)
        setOrgResourcesError(error instanceof Error ? error.message : "Failed to fetch teams")
      } finally {
        setIsLoadingOrgResources(false)
      }
    }
    
    loadTeams()
  }, [orgName, setTeams, setIsLoadingOrgResources, setOrgResourcesError])

  const handleTeamClick = (teamSlug: string) => {
    router.push(`/orgs/${orgName}/teams/${teamSlug}`)
  }

  if (isLoadingOrgResources) {
    return (
      <div className="container py-8 space-y-6">
        <h1 className="text-3xl font-bold">Teams</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (orgResourcesError) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {orgResourcesError}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {teams.length} Teams
        </Badge>
      </div>
      
      {teams.length === 0 ? (
        <Alert>
          <AlertTitle>No teams found</AlertTitle>
          <AlertDescription>
            This organization doesn't have any teams or you don't have access to view them.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card 
              key={team.id}
              className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleTeamClick(team.slug)}
            >
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>@{team.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {team.description || "No description provided"}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Team</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
