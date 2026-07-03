export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getStartupIdeaDetailAction } from "@/actions/startup-ideas.actions";
import { IdeaOverviewCard } from "@/components/startup-idea/idea-overview-card";
import { BusinessModelCard } from "@/components/startup-idea/business-model-card";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const idea = await getStartupIdeaDetailAction(id);
  if (!idea) {
    return { title: "Idea not found" };
  }
  return {
    title: idea.problem,
    description: idea.solution,
  };
}

export default async function StartupIdeaDetailPage({ params }: Props) {
  const { id } = await params;
  const idea = await getStartupIdeaDetailAction(id);

  if (!idea) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/opportunities">← Back to Opportunities</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IdeaOverviewCard idea={idea} />
        <BusinessModelCard idea={idea} />
      </div>
    </div>
  );
}
