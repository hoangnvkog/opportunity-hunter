import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StartupIdeaDetail } from "@/types/startup-idea-detail";

interface BusinessModelCardProps {
  idea: StartupIdeaDetail;
}

export function BusinessModelCard({ idea }: BusinessModelCardProps) {
  const sections = [
    { title: "MVP", content: idea.mvp },
    { title: "Pricing", content: idea.pricing },
    { title: "Target Customer", content: idea.customer, nullable: true },
    { title: "Distribution", content: idea.distribution, nullable: true },
    { title: "Competitors", content: idea.competitors, nullable: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {section.title}
            </h3>
            {section.content ? (
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            ) : section.nullable ? (
              <p className="text-sm italic text-muted-foreground">
                Not specified
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
