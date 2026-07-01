import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function IdeaNotFound() {
  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">Startup idea not found</h2>
          <p className="text-sm text-muted-foreground">
            The startup idea you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/opportunities">Back to Opportunities</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
