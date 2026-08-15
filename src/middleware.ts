import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/config";

// Proteksi route admin via sesi Supabase Auth (docs/14_ADMIN_DASHBOARD.md
// §14.1). Cookie ditulis balik agar refresh token terpersist dan sesi
// bertahan lebih dari umur access token (pola resmi @supabase/ssr).
export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const env = getSupabaseEnv();
  // Saat Supabase belum dikonfigurasi, request diloloskan — halaman admin
  // sendiri yang menampilkan status "belum dikonfigurasi".
  if (!env) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
