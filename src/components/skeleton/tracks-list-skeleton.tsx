import { Skeleton } from "@/components/ui/skeleton"

export function TracksListSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Existing Tracks</h2>
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                    >
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-8 w-[80px]" />
                    </div>
                ))}
            </div>
        </div>
    )
} 
