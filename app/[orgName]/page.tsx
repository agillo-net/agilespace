"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRepositoryStore } from "@/store/repository-store"
import { fetchOrganizationDetails, fetchOrganizationRepositories } from "@/lib/api-services"
import { useUIStore } from "@/store/ui-store"

export default function OrganizationPage() {
  const { orgName } = useParams()
  const { 
    organizationDetails, 
    organizationRepositories,
    isLoadingOrganization,
    organizationError,
    setOrganizationDetails,
    setOrganizationRepositories,
    setIsLoadingOrganization,
    setOrganizationError
  } = useRepositoryStore()

  // Update UI store with current organization
  const { setActiveOrganization } = useUIStore()

  useEffect(() => {
    if (typeof orgName === 'string') {
      setActiveOrganization(orgName)
    }
  }, [orgName, setActiveOrganization])

  useEffect(() => {
    async function fetchOrgData() {
      if (!orgName || typeof orgName !== 'string') return
      
      setIsLoadingOrganization(true)
      setOrganizationError(null)
      
      try {
        // Fetch organization details and repositories in parallel
        const [orgDetails, repos] = await Promise.all([
          fetchOrganizationDetails(orgName),
          fetchOrganizationRepositories(orgName)
        ])
        
        setOrganizationDetails(orgDetails)
        setOrganizationRepositories(repos)
      } catch (err) {
        console.error('Error fetching organization data:', err)
        setOrganizationError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsLoadingOrganization(false)
      }
    }
    
    fetchOrgData()
    
    // Cleanup function to reset state when component unmounts
    return () => {
      setOrganizationDetails(null)
      setOrganizationRepositories([])
    }
  }, [orgName, setIsLoadingOrganization, setOrganizationDetails, setOrganizationRepositories, setOrganizationError])

  if (isLoadingOrganization) {
    return <OrganizationSkeleton />
  }

  if (organizationError) {
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
            <p className="text-red-500">{organizationError}</p>
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
            <AvatarImage src={organizationDetails?.avatar_url} alt={organizationDetails?.login} />
            <AvatarFallback>{organizationDetails?.login?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{organizationDetails?.name || organizationDetails?.login}</CardTitle>
            <CardDescription>
              {organizationDetails?.description || "No description available"}
            </CardDescription>
            {organizationDetails?.location && (
              <div className="text-muted-foreground text-sm mt-1">
                {organizationDetails.location}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Organization Repositories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Repositories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizationRepositories.length > 0 ? (
            organizationRepositories.map((repo) => (
              <Card key={repo.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/${orgName}/${repo.name}`} className="hover:underline">
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
