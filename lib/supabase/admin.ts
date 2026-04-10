import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type LooseQueryBuilder = {
  delete: (...args: unknown[]) => LooseQueryBuilder;
  eq: (...args: unknown[]) => LooseQueryBuilder;
  insert: (...args: unknown[]) => LooseQueryBuilder;
  order: (...args: unknown[]) => LooseQueryBuilder;
  returns: <T = unknown>(...args: unknown[]) => Promise<{ data: T | null; error: unknown }>;
  select: (...args: unknown[]) => LooseQueryBuilder;
  single: <T = unknown>(...args: unknown[]) => Promise<{ data: T | null; error: unknown }>;
  update: (...args: unknown[]) => LooseQueryBuilder;
};

type LooseSupabaseAdminClient = ReturnType<typeof createClient> & {
  from: (table: string) => LooseQueryBuilder;
};

let adminClient: LooseSupabaseAdminClient | null = null;

export function getSupabaseAdminClient() {
  const { url, isConfigured } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfigured || !url || !serviceRoleKey) {
    throw new Error("Supabase admin client is not configured.");
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }) as LooseSupabaseAdminClient;
  }

  return adminClient;
}
