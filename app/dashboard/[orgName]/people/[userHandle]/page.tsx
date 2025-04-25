"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const orgName = params.orgName as string;
  const userHandle = params.userHandle as string;
  
  return (
    <div className="container mx-auto py-10">
      <Alert variant="default" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Under Construction</AlertTitle>
        <AlertDescription>
          This page is currently being developed and will be available soon.
        </AlertDescription>
      </Alert>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>User Profile: {userHandle}</CardTitle>
          <CardDescription>Organization: {orgName}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We are working on implementing this user profile page. 
            Check back soon to see detailed information about this team member.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
          <Button variant="default" onClick={() => router.push(`/orgs/${orgName}/people`)}>
            View All People
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
