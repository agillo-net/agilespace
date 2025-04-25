"use client";

import { FC } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, GitBranch } from "lucide-react";

const ReposPage: FC = () => {
  const { orgName } = useParams() as { orgName: string };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{orgName} Repositories</h1>
        <Button className="ml-auto" disabled>
          <GitBranch className="mr-2 h-4 w-4" />
          New Repository
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The repository management feature is currently under development.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Repository Management</CardTitle>
          <CardDescription>
            View and manage your organization&apos;s repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center border border-dashed rounded-md">
            <p className="text-muted-foreground">Repository list will appear here</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled>Refresh</Button>
          <Button disabled>View Details</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReposPage;
