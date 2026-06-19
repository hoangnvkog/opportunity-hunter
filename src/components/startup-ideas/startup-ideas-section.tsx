import { StartupIdeaCard } from "./startup-idea-card";
import type { StartupIdeaCardData } from "@/types/dashboard";

interface StartupIdeasSectionProps {
  ideas: StartupIdeaCardData[];
}

export default function StartupIdeasSection({ ideas }: StartupIdeasSectionProps) {
  if (ideas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No startup ideas yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ideas.map((idea) => (
        <StartupIdeaCard
          key={idea.id}
          problem={idea.problem}
          solution={idea.solution}
          mvp={idea.mvp}
          pricing={idea.pricing}
          clusterName={idea.cluster_name}
          clusterDescription={idea.cluster_description}
        />
      ))}
    </div>
  );
}
export { StartupIdeasSection };
