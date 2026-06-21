import { StartupIdeasRepository } from "@/lib/db/repositories/startup-ideas.repository";
import type { StartupIdeaDetail } from "@/types/startup-idea-detail";

export async function getStartupIdeaDetail(id: string): Promise<StartupIdeaDetail | null> {
  const repo = await StartupIdeasRepository.create();
  return repo.findDetailById(id);
}
