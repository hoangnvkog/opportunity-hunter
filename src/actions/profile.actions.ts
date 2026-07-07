"use server";

import { getUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getProfile() {
  try {
    const user = await getUser();
    
    if (!user) {
      return null;
    }

    const supabase = await getSupabaseServerClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, email, created_at")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error in getProfile:", error);
    return null;
  }
}

export async function updateProfile(data: { name?: string; avatar_url?: string }) {
  try {
    const user = await getUser();
    
    if (!user) {
      return { error: "Unauthorized" };
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return { error: "Failed to update profile" };
  }
}
