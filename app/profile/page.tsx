"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null)
  const [userRepos, setUserRepos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch user details
        const userResponse = await fetch('/api/github/user')
        if (!userResponse.ok) throw new Error('Failed to fetch user data')
        const userData = await userResponse.json()
        setUserData(userData)
        
        // Fetch user repositories
        const reposResponse = await fetch('/api/github/repos')
        if (!reposResponse.ok) throw new Error('Failed to fetch repositories')
        const reposData = await reposResponse.json()
        setUserRepos(reposData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>Error Loading Profile</CardTitle>
            <CardDescription>
              We encountered a problem while loading your profile data.
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
      {/* Profile Header */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userData?.avatar_url} alt={userData?.login} />
            <AvatarFallback>{userData?.login?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{userData?.name || userData?.login}</CardTitle>
            <CardDescription>{userData?.bio || "No bio available"}</CardDescription>
            {userData?.location && (
              <div className="text-muted-foreground text-sm mt-1">
                {userData.location}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* User Repositories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Recent Repositories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRepos.length > 0 ? (
            userRepos.map((repo) => (
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
                <CardContent className="pt-0">
                  <div className="flex gap-2 flex-wrap">
                    {repo.language && (
                      <Badge variant="outline">{repo.language}</Badge>
                    )}
                    <Badge variant="secondary">⭐ {repo.stargazers_count}</Badge>
                    <Badge variant="secondary">🍴 {repo.forks_count}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                No repositories found.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      {/* Profile Header Skeleton */}
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
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
