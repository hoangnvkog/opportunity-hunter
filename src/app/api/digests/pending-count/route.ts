import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { WeeklyDigestsRepository } from "@/lib/db/repositories/weekly-digests.repository";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const repo = await WeeklyDigestsRepository.create();
  const digests = await repo.listByUser(user.id, 20);

  const pending = digests.filter((d) => d.status === "queued").length;
  return NextResponse.json({ count: pending });
}
