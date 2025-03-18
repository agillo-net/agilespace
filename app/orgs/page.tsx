"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useGithubStore } from "@/store/github-store"
import { useGithubApi } from "@/lib/api-handler"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchOrganizations, fetchUserData } from "@/lib/api-services";

export default function OrganizationsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const {
    organizations,
    organizationsError,
    isLoadingOrganizations,
    setOrganizations,
    setIsLoadingOrganizations,
    setOrganizationsError
  } = useGithubStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organizations data
        const orgsData = await fetchOrganizations();
        setOrganizations(orgsData);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizationsError(error instanceof Error ? error.message : "Failed to fetch organizations");
      } finally {
        setIsLoadingOrganizations(false);
      }
    };

    fetchData();
  }, [])

  const filteredOrganizations = organizations.filter(org =>
    org.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Loading skeletons
  if (isLoadingOrganizations) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Organizations</h1>
          <div className="relative w-64">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (organizationsError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground">{organizationsError}</p>
          <Button className="mt-4" onClick={() => fetchOrganizations()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map((org) => (
          <Card
            key={org.login}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/orgs/${org.login}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {org.avatar_url && (
                  <img
                    src={org.avatar_url}
                    alt={org.login}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <CardTitle>{org.login}</CardTitle>
              </div>
              <CardDescription className="mt-2">
                {org.description || "No description provided"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={org.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View on GitHub
              </a>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">View Details</Button>
              <Button variant="ghost" size="sm">
                <Link href={`/orgs/${org.login}`} onClick={(e) => e.stopPropagation()}>
                  Visit
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredOrganizations.length === 0 && !isLoadingOrganizations && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No organizations found matching your search.</p>
        </div>
      )}
    </div>
  )
}
