import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function OrgSidebarSkeleton() {
  return (
    <div className="space-y-0">
      {/* Repository Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-8" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="pl-10 pr-4 mb-2">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>

      {/* Projects Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-8" />
        </div>
      </div>

      {/* Teams Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-8" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSidebarSkeleton() {
  return (
    <div className="space-y-0">
      {/* Issues Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="pl-10 pr-4 mb-2">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>

      {/* PRs Section Skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="pl-10 pr-4 mb-2">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
