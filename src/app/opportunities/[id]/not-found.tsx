import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";

export default function OpportunityNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">Opportunity not found</h2>
          <p className="text-muted-foreground">
            The opportunity you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
          <Link
            href="/opportunities"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Opportunities
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
