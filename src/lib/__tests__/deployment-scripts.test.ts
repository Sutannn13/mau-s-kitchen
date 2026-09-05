import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

interface PackageFile {
  scripts: Record<string, string>;
}

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("production release commands", () => {
  it("selalu menjalankan security preflight sebelum Cloudflare release", () => {
    const packageFile = JSON.parse(readProjectFile("package.json")) as PackageFile;

    expect(packageFile.scripts.deploy).toBe(
      "npm run security:preflight && opennextjs-cloudflare build && node scripts/deploy-worker.mjs",
    );
    expect(packageFile.scripts["deploy:staging"]).toBe(
      "npm run security:preflight && opennextjs-cloudflare build --env staging && node scripts/deploy-worker.mjs --env staging",
    );
    expect(packageFile.scripts.upload).toBe(
      "npm run security:preflight && opennextjs-cloudflare build && opennextjs-cloudflare upload",
    );
    // Wrapper deploy wajib memutus delegasi balik wrangler -> OpenNext
    // supaya tidak terjadi loop rekrusif saat deploy.
    expect(readProjectFile("scripts/deploy-worker.mjs")).toContain(
      'OPEN_NEXT_DEPLOY: "true"',
    );
  });

  it("mempertahankan build lokal dan PR tanpa secret produksi", () => {
    const packageFile = JSON.parse(readProjectFile("package.json")) as PackageFile;

    expect(packageFile.scripts.build).toBe("next build");
    expect(packageFile.scripts["build:vercel"]).toBe(
      "node scripts/vercel-build.mjs",
    );
  });

  it.each([
    ["preview", "build"],
    ["production", "build:production"],
  ])("memilih build Vercel untuk %s", (vercelEnvironment, expectedScript) => {
    const result = spawnSync(
      process.execPath,
      [resolve(process.cwd(), "scripts/vercel-build.mjs"), "--print"],
      {
        encoding: "utf8",
        env: { ...process.env, VERCEL_ENV: vercelEnvironment },
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(expectedScript);
  });

  it("mendelegasikan deployment CI ke perintah rilis yang sudah dijaga", () => {
    const workflow = readProjectFile(".github/workflows/deploy.yml");

    expect(workflow).toContain("run: npm run deploy");
    expect(workflow).toContain(
      "NEXT_PUBLIC_QRIS_MERCHANT_NAME: ${{ secrets.NEXT_PUBLIC_QRIS_MERCHANT_NAME }}",
    );
    expect(workflow).not.toContain("run: npm run security:preflight");
    expect(workflow).not.toMatch(/run:\s+(?:npx\s+)?(?:opennextjs-cloudflare|wrangler)/);
  });

  it("menggagalkan rilis produksi bila QRIS tidak aktif", () => {
    const preflight = readProjectFile("scripts/security-preflight.mjs");

    expect(preflight).toContain(
      "NEXT_PUBLIC_ENABLE_QRIS wajib true untuk rilis produksi MAU'S Kitchen.",
    );
  });

  it("mengonfigurasi rate limit pra-database untuk endpoint publik", () => {
    const wrangler = readProjectFile("wrangler.toml");

    expect(wrangler).toContain('name = "ORDER_READ_RATE_LIMITER"');
    expect(wrangler).toContain('name = "HEALTH_RATE_LIMITER"');
    expect(wrangler).toContain('DEPLOYMENT_PLATFORM = "cloudflare"');
  });

  it("mewajibkan migration concurrency dan pembayaran sebelum rilis", () => {
    const preflight = readProjectFile("scripts/security-preflight.mjs");
    const migration = readProjectFile(
      "supabase/migrations/20260830000100_atomic_order_codes.sql",
    );

    expect(preflight).toContain("order_daily_sequences?select=day_key");
    expect(preflight).toContain("payment_verified_at");
    expect(preflight).toContain("rpc/insert_order_with_items_v2");
    expect(migration).toContain("insert_order_with_items_v2");
    expect(migration).toContain("orders_enforce_manual_payment_verification");
  });

  it("mengaktifkan QRIS dan observability pada runtime Cloudflare", () => {
    const wrangler = readProjectFile("wrangler.toml");

    expect(wrangler).toContain('NEXT_PUBLIC_ENABLE_QRIS = "true"');
    expect(wrangler).toContain("[observability]");
    expect(wrangler).toContain("[observability.traces]");
  });
});
