import { Skeleton } from "@/components/ui/skeleton"

export function TagsListSkeleton() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Tags</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 border rounded-lg"
                        >
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-[80px]" />
                                <Skeleton className="h-8 w-[80px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
} 
