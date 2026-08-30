import { createHmac } from "node:crypto";
import { isIP } from "node:net";

import { getServiceClient } from "@/lib/supabase/admin";

interface RateLimitOptions {
  maxRequests?: number;
  windowSeconds?: number;
}

interface RateLimitStore {
  hits: Map<string, number[]>;
}

type EdgeRateLimitBindingName =
  | "ORDER_READ_RATE_LIMITER"
  | "HEALTH_RATE_LIMITER";

interface EdgeRateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

const globalScope = globalThis as unknown as {
  __mausKitchenRateLimit?: RateLimitStore;
};

const memoryStore: RateLimitStore = (globalScope.__mausKitchenRateLimit ??= {
  hits: new Map<string, number[]>(),
});

function hashKey(key: string): string {
  const salt =
    process.env.RATE_LIMIT_SALT ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "maus-kitchen-development";
  return createHmac("sha256", salt).update(key).digest("hex");
}

function checkMemoryLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number,
): boolean {
  const timestamps = (memoryStore.hits.get(key) ?? []).filter(
    (time) => now - time < windowMs,
  );

  if (timestamps.length >= maxRequests) {
    memoryStore.hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  memoryStore.hits.set(key, timestamps);
  if (memoryStore.hits.size > 5_000) {
    for (const [storedKey, storedTimestamps] of memoryStore.hits) {
      if (storedTimestamps.every((time) => now - time >= windowMs)) {
        memoryStore.hits.delete(storedKey);
      }
    }
  }
  return false;
}

export async function isRateLimited(
  key: string,
  options: RateLimitOptions = {},
  now: number = Date.now(),
): Promise<boolean> {
  const maxRequests = options.maxRequests ?? 5;
  const windowSeconds = options.windowSeconds ?? 60;

  if (process.env.NODE_ENV === "test") {
    return checkMemoryLimit(key, maxRequests, windowSeconds * 1_000, now);
  }

  const supabase = getServiceClient();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] Supabase tidak tersedia; request diblokir.");
      return true;
    }
    return checkMemoryLimit(key, maxRequests, windowSeconds * 1_000, now);
  }

  const result = await supabase.rpc("check_rate_limit", {
    p_key_hash: hashKey(key),
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (result.error) {
    console.error("[rate-limit] RPC gagal:", result.error.message);
    return true;
  }

  return result.data === true;
}

function isEdgeRateLimitBinding(value: unknown): value is EdgeRateLimitBinding {
  return (
    typeof value === "object" &&
    value !== null &&
    "limit" in value &&
    typeof (value as { limit?: unknown }).limit === "function"
  );
}

export async function isPublicReadRateLimited(
  bindingName: EdgeRateLimitBindingName,
  key: string,
  fallbackOptions: RateLimitOptions,
): Promise<boolean> {
  if (process.env.DEPLOYMENT_PLATFORM !== "cloudflare") {
    return isRateLimited(key, fallbackOptions);
  }

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const binding = env[bindingName];
    if (!isEdgeRateLimitBinding(binding)) {
      console.error("[rate-limit] Binding Cloudflare tidak tersedia.", {
        bindingName,
      });
      return true;
    }

    const result = await binding.limit({ key });
    return !result.success;
  } catch (error) {
    console.error("[rate-limit] Pemeriksaan edge gagal.", {
      bindingName,
      error: error instanceof Error ? error.message : "unknown",
    });
    return true;
  }
}

export function getClientIp(headers: Headers): string {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.DEPLOYMENT_PLATFORM !== "cloudflare"
  ) {
    return "unknown";
  }

  const cloudflareIp = headers.get("cf-connecting-ip")?.trim() ?? "";
  if (
    cloudflareIp.length > 0 &&
    cloudflareIp.length <= 45 &&
    !cloudflareIp.includes(",") &&
    isIP(cloudflareIp) !== 0
  ) {
    return cloudflareIp;
  }

  // Production runs on Cloudflare; foreign proxy headers are user input here.
  return "unknown";
}
