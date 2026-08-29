import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/config";

interface AdminIdentity {
  id: string;
  email: string;
}

interface AuthenticatedUser {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
}

function configuredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getAdminIdentity(user: AuthenticatedUser | null): AdminIdentity | null {
  if (!user?.email) {
    return null;
  }

  const email = user.email.trim().toLowerCase();
  const hasAdminRole = user.app_metadata?.role === "admin";
  if (!hasAdminRole && !configuredAdminEmails().has(email)) {
    return null;
  }

  return { id: user.id, email };
}

// Klien berbasis cookie untuk memverifikasi sesi admin di middleware dan
// route handler. Mengembalikan null bila Supabase belum dikonfigurasi —
// pemanggil wajib menangani mode itu (admin tidak tersedia).
export function createSessionClientFromCookies(
  cookieGetter: () => Array<{ name: string; value: string }>,
) {
  const env = getSupabaseEnv();
  if (!env) {
    return null;
  }

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieGetter();
      },
      // Middleware/route handler yang perlu memperbarui cookie menangani
      // sendiri via getAll/setAll versi mereka; default di sini no-op agar
      // verifikasi baca-saja aman dipakai di mana saja.
      setAll() {
        /* sengaja kosong: hanya verifikasi, tidak menulis cookie */
      },
    },
  });
}

// Verifikasi sesi admin. Mengembalikan user bila valid, null bila tidak.
export async function verifyAdminSession(
  cookieGetter: () => Array<{ name: string; value: string }>,
): Promise<AdminIdentity | null> {
  const supabase = createSessionClientFromCookies(cookieGetter);
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return getAdminIdentity(user);
}

// Helper untuk route handler: verifikasi sesi admin langsung dari objek
// Request (header cookie diparsing manual — route handler Next 15 tidak
// mengekspos cookie API seperti NextRequest).
export async function verifyAdminRequest(
  request: Request,
): Promise<AdminIdentity | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.includes("="))
    .map((part) => {
      const separator = part.indexOf("=");
      return {
        name: part.slice(0, separator),
        value: part.slice(separator + 1),
      };
    });

  return verifyAdminSession(() => cookies);
}
