// Konfigurasi Supabase terpusat. Semua helper lain membaca dari sini agar
// pengecekan "sudah dikonfigurasi atau belum" hanya punya satu sumber.

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    anonKey,
    ...(serviceRoleKey ? { serviceRoleKey } : {}),
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

// Service role wajib tersedia untuk operasi tulis server (pesanan, storage).
export function hasServiceRoleKey(): boolean {
  return getSupabaseEnv()?.serviceRoleKey !== undefined;
}
