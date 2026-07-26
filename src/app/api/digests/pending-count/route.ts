import { NextResponse } from "next/server";
import { WeeklyDigestsRepository } from "@/lib/db/repositories/weekly-digests.repository";
import { requireUserAPI } from "@/lib/auth/api-guard";

export async function GET() {
  const guard = await requireUserAPI();
  if (!guard.ok) return NextResponse.json({ count: 0 });

  const repo = await WeeklyDigestsRepository.create();
  const digests = await repo.listByUser(guard.user.id, 20);

  const pending = digests.filter((d) => d.status === "queued").length;
  return NextResponse.json({ count: pending });
}
