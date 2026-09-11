import { spawnSync } from "node:child_process";

// Deploy worker yang sudah di-build OpenNext (.open-next) memakai `wrangler
// deploy` langsung, bukan `opennextjs-cloudflare deploy`. Alasan: command
// OpenNext selalu menjalankan populate-cache remote yang memanggil R2 API,
// sedangkan token CI belum punya permission R2 (403). Tanpa langkah ini
// deploy CI gagal. Cache R2 tetap terisi lazy saat runtime.
// `--experimental-provision=false` mematikan provisioning check wrangler yang
// juga memanggil R2 API (isConnectedToExistingResource) - semua binding sudah
// menunjuk resource yang ada (bucket/D1 diverifikasi manual), jadi cek tidak
// diperlukan dan hanya menuntut permission ekstra di token.
// Upgrade trigger: begitu CLOUDFLARE_API_TOKEN CI diberi permission R2:Edit,
// kembali ke `opennextjs-cloudflare deploy` (tanpa flag provisioning) agar
// cache ter-populate saat deploy.
// OPEN_NEXT_DEPLOY=true mencegah wrangler mendelegasikan balik ke
// opennextjs-cloudflare deploy (loop tak berujung).
// Ditambahkan mekanisme auto-retry (hingga 3x) untuk menangani kendala transient
// 503 Service Unavailable / connection termination dari server Cloudflare API.
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const args = process.argv.slice(2);

function runDeploy() {
  return spawnSync(
    "npx",
    ["wrangler", "deploy", "--experimental-provision=false", ...args],
    {
      stdio: "inherit",
      env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
      shell: true,
    },
  );
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let attempt = 1;
let result;

while (attempt <= MAX_RETRIES) {
  result = runDeploy();
  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt < MAX_RETRIES) {
    console.warn(
      `\n[deploy-worker] Wrangler deploy gagal (percobaan ${attempt}/${MAX_RETRIES}). Mencoba ulang dalam ${RETRY_DELAY_MS / 1000}s...\n`,
    );
    sleep(RETRY_DELAY_MS * attempt);
  }
  attempt++;
}

process.exit(result?.status ?? 1);

