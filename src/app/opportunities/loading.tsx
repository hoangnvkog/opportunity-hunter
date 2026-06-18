import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function OpportunitiesLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={i} className="text-left py-3 px-4">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3 px-4">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}