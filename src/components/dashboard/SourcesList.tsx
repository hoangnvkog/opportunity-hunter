import { getSourceProviders } from "@/services/sources/registry";

export function SourcesList() {
  const providers = getSourceProviders();

  const sourceDisplayNames: Record<string, string> = {
    reddit: "Reddit",
    hackernews: "Hacker News",
    producthunt: "Product Hunt",
    twitter: "Twitter",
    indiehackers: "IndieHackers",
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Sources</h3>
      <div className="space-y-2">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
          >
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium">
              {sourceDisplayNames[provider.name] || provider.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
