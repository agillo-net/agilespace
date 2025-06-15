import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function OrganizationsListSkeleton() {
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
