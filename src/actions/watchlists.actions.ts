"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WatchlistsService } from "@/services/watchlists/watchlists.service";
import type { WatchlistInsert, WatchlistUpdate } from "@/types/watchlist";

export async function createWatchlistAction(data: WatchlistInsert) {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const service = await WatchlistsService.create();
  const watchlist = await service.createWatchlist(user.id, data);

  revalidatePath("/watchlists");
  return watchlist;
}

export async function updateWatchlistAction(id: string, data: WatchlistUpdate) {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const service = await WatchlistsService.create();
  const watchlist = await service.updateWatchlist(id, user.id, data);

  revalidatePath("/watchlists");
  return watchlist;
}

export async function deleteWatchlistAction(id: string) {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const service = await WatchlistsService.create();
  await service.deleteWatchlist(id, user.id);

  revalidatePath("/watchlists");
}

export async function getUserWatchlistsAction() {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const service = await WatchlistsService.create();
  return service.getUserWatchlists(user.id);
}
