import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function OpportunityDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
      </div>

      {/* Summary Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Startup Ideas Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-full bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}