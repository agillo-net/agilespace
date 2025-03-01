"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function OrganizationPage() {
  const { orgName } = useParams()
  const [orgData, setOrgData] = useState<any>(null)
  const [orgRepos, setOrgRepos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrgData() {
      if (!orgName) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch organization details
        const orgResponse = await fetch(`/api/github/org/${orgName}`)
        if (!orgResponse.ok) throw new Error('Failed to fetch organization data')
        const orgData = await orgResponse.json()
        setOrgData(orgData)
        
        // Fetch organization repositories
        const reposResponse = await fetch(`/api/github/org/${orgName}/repos`)
        if (!reposResponse.ok) throw new Error('Failed to fetch organization repositories')
        const reposData = await reposResponse.json()
        setOrgRepos(reposData)
      } catch (err) {
        console.error('Error fetching organization data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrgData()
  }, [orgName])

  if (isLoading) {
    return <OrganizationSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>Error Loading Organization</CardTitle>
            <CardDescription>
              We encountered a problem while loading the organization data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Organization Header */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={orgData?.avatar_url} alt={orgData?.login} />
            <AvatarFallback>{orgData?.login?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{orgData?.name || orgData?.login}</CardTitle>
            <CardDescription>
              {orgData?.description || "No description available"}
            </CardDescription>
            {orgData?.location && (
              <div className="text-muted-foreground text-sm mt-1">
                {orgData.location}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Organization Repositories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Repositories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgRepos.length > 0 ? (
            orgRepos.map((repo) => (
              <Card key={repo.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={repo.html_url} target="_blank" className="hover:underline">
                      {repo.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {repo.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-2 flex-wrap">
                  {repo.language && (
                    <Badge variant="outline">{repo.language}</Badge>
                  )}
                  <Badge variant="secondary">⭐ {repo.stargazers_count}</Badge>
                  <Badge variant="secondary">🍴 {repo.forks_count}</Badge>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                No repositories found for this organization.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function OrganizationSkeleton() {
  return (
    <div className="space-y-8">
      {/* Organization Header Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
      </Card>

      {/* Repository List Skeleton */}
      <div>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
