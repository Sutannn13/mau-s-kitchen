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
const args = process.argv.slice(2);
const result = spawnSync(
  "npx",
  ["wrangler", "deploy", "--experimental-provision=false", ...args],
  {
    stdio: "inherit",
    env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
    shell: true,
  },
);
process.exit(result.status ?? 1);
