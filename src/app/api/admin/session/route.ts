import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/supabase/auth";

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }

  return NextResponse.json(
    { success: true, data: { email: admin.email } },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
