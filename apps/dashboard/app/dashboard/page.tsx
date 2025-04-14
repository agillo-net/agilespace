"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, Clock, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Welcome to GitHub Work Session Tracker</h2>
      <p className="text-muted-foreground">
        Track and analyze your work sessions with GitHub issues.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Link href="/dashboard/tracker">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Track Sessions</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Search for GitHub issues and track your time spent working on them
              </p>
              <div className="mt-4 flex items-center">
                <Button variant="link" className="p-0 h-auto">
                  Go to Tracker <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analysis">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Analyze Time</CardTitle>
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View aggregated work session data across team members
              </p>
              <div className="mt-4 flex items-center">
                <Button variant="link" className="p-0 h-auto">
                  View Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}