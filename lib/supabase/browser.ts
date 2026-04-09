import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured || !url || !anonKey) {
    throw new Error("Supabase is not configured.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
