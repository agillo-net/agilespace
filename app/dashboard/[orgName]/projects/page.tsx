"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProjectsPage() {
  const params = useParams();
  const orgName = params.orgName as string;

  return (
    <div className="container py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Under Construction</AlertTitle>
        <AlertDescription>
          This page is currently being developed.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Projects for {orgName}</CardTitle>
          <CardDescription>
            This section will list all projects for this organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 border border-dashed rounded-md bg-muted/50">
            <p className="text-muted-foreground text-center">
              Project listing functionality will be implemented soon.
              <br />
              Check back later for updates.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Coming in the next release
          </p>
          <Button variant="outline" disabled>
            Create Project
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
