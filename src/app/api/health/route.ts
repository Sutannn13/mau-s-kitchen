import { NextResponse } from "next/server";

import { getServiceClient } from "@/lib/supabase/admin";
import { hasAdminAuthorizationConfigured } from "@/lib/supabase/config";
import { isPrivacyConfigurationReady } from "@/lib/privacy";
import { getClientIp, isPublicReadRateLimited } from "@/lib/rate-limit";

const HEALTH_CACHE_HEADER =
  "public, max-age=0, s-maxage=10, stale-while-revalidate=20";

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = getServiceClient();
  if (!supabase || !hasAdminAuthorizationConfigured() || !isPrivacyConfigurationReady()) {
    return NextResponse.json(
      { status: "not_ready" },
      { status: 503, headers: { "Cache-Control": HEALTH_CACHE_HEADER } },
    );
  }

  if (
    await isPublicReadRateLimited(
      "HEALTH_RATE_LIMITER",
      `health:${getClientIp(request.headers)}`,
      { maxRequests: 30, windowSeconds: 60 },
    )
  ) {
    return NextResponse.json(
      { status: "rate_limited" },
      { status: 429, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const probe = await supabase.from("orders").select("id", { head: true }).limit(1);
  if (probe.error) {
    return NextResponse.json(
      { status: "not_ready" },
      { status: 503, headers: { "Cache-Control": HEALTH_CACHE_HEADER } },
    );
  }

  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": HEALTH_CACHE_HEADER } },
  );
}
