import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export async function getUserProfile(userId: string) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<ProfileRow>();
}
