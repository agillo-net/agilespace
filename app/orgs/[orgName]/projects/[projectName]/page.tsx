"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation";

export default function ProjectPage() {
  const params = useParams();
  const orgName = params.orgName as string;
  const projectName = params.projectName as string;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orgs/${orgName}/projects`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{projectName}</h1>
        <p className="text-muted-foreground">
          {orgName} / {projectName}
        </p>
      </div>

      <Separator />

      <Alert variant="destructive">
        <Construction className="h-4 w-4" />
        <AlertTitle>Under Construction</AlertTitle>
        <AlertDescription>
          This project page is currently being developed and will be implemented soon.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            The detailed view for project &quot;{projectName}&quot; is under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page will display project details, tasks, team members, and progress metrics.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Project Settings</Button>
          <Button disabled>View Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
