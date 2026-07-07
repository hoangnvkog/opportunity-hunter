import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();

  await supabase
    .from("subscriptions")
    .update({ status: "active" })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}