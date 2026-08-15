import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv, hasServiceRoleKey } from "@/lib/supabase/config";

// Klien service role — MELEWATI RLS, hanya boleh diimpor dari kode server
// (route handler / server component). Jangan pernah diimpor komponen client.
let cachedClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env || !hasServiceRoleKey()) {
    return null;
  }

  cachedClient ??= createClient(env.url, env.serviceRoleKey as string, {
    auth: {
      // Klien server tidak memelihara sesi pengguna.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
