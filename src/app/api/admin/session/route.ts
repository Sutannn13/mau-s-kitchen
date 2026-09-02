import { NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

import { verifyAdminRequest } from "@/lib/supabase/auth";

export async function GET(request: Request): Promise<NextResponse> {
  const refreshedCookies: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];
  const admin = await verifyAdminRequest(request, (cookiesToSet) => {
    refreshedCookies.push(...cookiesToSet);
  });
  let response: NextResponse;
  if (!admin) {
    response = NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  } else {
    response = NextResponse.json(
      { success: true, data: { email: admin.email } },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  for (const cookie of refreshedCookies) {
    response.cookies.set(cookie.name, cookie.value, {
      domain: cookie.options.domain,
      expires: cookie.options.expires,
      httpOnly: cookie.options.httpOnly,
      maxAge: cookie.options.maxAge,
      path: cookie.options.path,
      sameSite: cookie.options.sameSite,
      secure: cookie.options.secure,
    });
  }
  return response;
}
