import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Target } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI-Powered Opportunity Discovery
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Discover Startup
            <span className="block text-primary">Opportunities Automatically</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Turn millions of online complaints into actionable startup ideas. 
            Our AI analyzes discussions and reviews to find the most promising 
            business opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center rounded-md border bg-card px-8 py-3 text-base font-medium transition-colors hover:bg-secondary"
            >
              Explore Opportunities
              <TrendingUp className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3 pt-16">
            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">
                Automatically detect pain points and cluster similar complaints
                across multiple platforms.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Scoring</h3>
              <p className="text-muted-foreground">
                Rank opportunities by frequency, severity, and buying intent to
                prioritize the best ideas.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Market Trends</h3>
              <p className="text-muted-foreground">
                Track emerging trends and categories to stay ahead of market
                demands and competitor movements.
              </p>
            </div>
          </div>

          <div className="pt-16 border-t">
            <p className="text-sm text-muted-foreground">
              Trusted by founders, product managers, and venture capitalists to
              discover high-potential startup ideas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
