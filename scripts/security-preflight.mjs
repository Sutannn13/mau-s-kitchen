import { existsSync } from "node:fs";
import { join } from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const errors = [];
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) errors.push(`${name} belum diisi.`);
  return value ?? "";
};
const isTbd = (value) => !value || value.trim().toUpperCase() === "TBD";
const isEnabled = (value) => value?.trim().toLowerCase() === "true";

const siteUrl = required("NEXT_PUBLIC_SITE_URL");
const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const anonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const adminEmails = required("ADMIN_EMAILS");
const rateLimitSalt = required("RATE_LIMIT_SALT");
const retentionRaw = required("ORDER_RETENTION_DAYS");
const retentionDays = Number.parseInt(retentionRaw, 10);

try {
  const parsed = new URL(siteUrl);
  if (parsed.protocol !== "https:" || parsed.hostname === "localhost") {
    errors.push("NEXT_PUBLIC_SITE_URL harus domain HTTPS produksi.");
  }
} catch {
  errors.push("NEXT_PUBLIC_SITE_URL bukan URL valid.");
}

try {
  const parsed = new URL(supabaseUrl);
  if (parsed.protocol !== "https:") {
    errors.push("NEXT_PUBLIC_SUPABASE_URL harus memakai HTTPS.");
  }
} catch {
  errors.push("NEXT_PUBLIC_SUPABASE_URL bukan URL valid.");
}

if (adminEmails && !adminEmails.split(",").every((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))) {
  errors.push("ADMIN_EMAILS harus berisi email valid, dipisahkan koma.");
}
if (rateLimitSalt && rateLimitSalt.length < 32) {
  errors.push("RATE_LIMIT_SALT minimal 32 karakter acak.");
}
if (retentionRaw && (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3_650)) {
  errors.push("ORDER_RETENTION_DAYS harus 30 sampai 3650.");
}
if (isTbd(process.env.NEXT_PUBLIC_BUSINESS_HOURS)) {
  errors.push("NEXT_PUBLIC_BUSINESS_HOURS belum dikonfirmasi pemilik.");
}
if (isTbd(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS)) {
  errors.push("NEXT_PUBLIC_BUSINESS_ADDRESS belum dikonfirmasi pemilik.");
}

if (isEnabled(process.env.NEXT_PUBLIC_ENABLE_TRANSFER)) {
  if (isTbd(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER)) {
    errors.push("Transfer aktif tetapi nomor rekening belum siap.");
  }
  if (isTbd(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME)) {
    errors.push("Transfer aktif tetapi nama rekening belum siap.");
  }
}
if (isEnabled(process.env.NEXT_PUBLIC_ENABLE_QRIS)) {
  const qrisPath = process.env.NEXT_PUBLIC_QRIS_IMAGE_PATH ?? "/assets/payment/qris.png";
  if (!existsSync(join(process.cwd(), "public", qrisPath.replace(/^\/+/, "")))) {
    errors.push("QRIS aktif tetapi berkas gambar tidak ditemukan.");
  }
}

if (supabaseUrl && anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    const settings = await response.json();
    if (!response.ok || settings.disable_signup !== true) {
      errors.push("Signup publik Supabase masih aktif.");
    }
  } catch {
    errors.push("Konfigurasi Supabase Auth tidak dapat diverifikasi.");
  }
}

if (supabaseUrl && serviceRoleKey) {
  const serviceHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/orders?select=public_token&limit=1`,
      { headers: serviceHeaders },
    );
    if (!response.ok) errors.push("Migrasi public_token belum diterapkan.");
  } catch {
    errors.push("Schema orders Supabase tidak dapat diverifikasi.");
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/check_rate_limit`,
      {
        method: "POST",
        headers: { ...serviceHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_key_hash: "security-preflight",
          p_window_seconds: 60,
          p_max_requests: 100,
        }),
      },
    );
    if (!response.ok) errors.push("RPC rate limiter belum diterapkan.");
  } catch {
    errors.push("RPC rate limiter Supabase tidak dapat diverifikasi.");
  }

  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket/payment-proofs`, {
      headers: serviceHeaders,
    });
    const bucket = await response.json();
    const allowed = Array.isArray(bucket.allowed_mime_types)
      ? bucket.allowed_mime_types
      : [];
    const fileSizeLimit = Number(bucket.file_size_limit);
    const expectedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedSet = new Set(allowed);
    const mimeTypesMatch = allowed.length === expectedMimeTypes.length &&
      expectedMimeTypes.every((t) => allowedSet.has(t));
    if (
      !response.ok ||
      bucket.public !== false ||
      !Number.isFinite(fileSizeLimit) ||
      fileSizeLimit !== 1024 * 1024 ||
      !mimeTypesMatch
    ) {
      errors.push("Bucket payment-proofs belum privat atau belum dibatasi dengan benar.");
    }
  } catch {
    errors.push("Konfigurasi bucket payment-proofs tidak dapat diverifikasi.");
  }
}

if (errors.length > 0) {
  console.error("Security preflight gagal:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Security preflight lulus.");
