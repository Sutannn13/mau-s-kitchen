import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const retentionDays = Number.parseInt(process.env.ORDER_RETENTION_DAYS ?? "", 10);

if (!url || !serviceRoleKey) {
  throw new Error("Supabase URL dan service role key wajib diisi.");
}
if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3_650) {
  throw new Error("ORDER_RETENTION_DAYS harus 30 sampai 3650.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cutoff = new Date(Date.now() - retentionDays * 86_400_000).toISOString();
let deletedCount = 0;

while (true) {
  const result = await supabase
    .from("orders")
    .select("id,payment_proof_url")
    .lt("created_at", cutoff)
    .limit(100);

  if (result.error) throw result.error;
  const rows = result.data ?? [];
  if (rows.length === 0) break;

  const proofPaths = rows
    .map((row) => row.payment_proof_url)
    .filter((path) => typeof path === "string" && path.length > 0);
  if (proofPaths.length > 0) {
    const removed = await supabase.storage.from("payment-proofs").remove(proofPaths);
    if (removed.error) throw removed.error;
  }

  const deleted = await supabase
    .from("orders")
    .delete()
    .in("id", rows.map((row) => row.id));
  if (deleted.error) throw deleted.error;
  deletedCount += rows.length;
}

console.log(`Retensi selesai: ${deletedCount} pesanan kedaluwarsa dihapus.`);
