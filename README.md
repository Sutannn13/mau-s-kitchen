# MAU'S Kitchen

Website katalog dan pemesanan MAU'S Kitchen: Taichan, minuman, dan ChocoBerry.
Pelanggan dapat memesan tanpa akun, memilih pembayaran QRIS atau tunai, dan
melacak pesanan. Dashboard admin digunakan untuk mengelola menu dan pesanan.

[maukitchen.my.id](https://maukitchen.my.id)

## Pengembangan lokal

Gunakan Node.js 22 dan npm. Install dependency sesuai lockfile:

```sh
npm ci
```

Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi Supabase dan
variabel yang diperlukan. Gunakan project Supabase pengembangan atau staging;
checkout menulis data pesanan. Skema dan migrasi database tersedia di
[`supabase/`](supabase/).

```sh
npm run dev
```

Buka `http://localhost:3000`. File `.env.local` dan konfigurasi tool lokal tidak
boleh di-commit.

## Pemeriksaan

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Untuk memeriksa konfigurasi sebelum deployment:

```sh
npm run security:preflight -- --target=staging
```

## Deployment

Aplikasi memakai Next.js, React, TypeScript, dan Tailwind CSS. Supabase menangani
database dan autentikasi admin. OpenNext menjalankan aplikasi di Cloudflare Workers.

Workflow di [`.github/workflows/`](.github/workflows/) menjalankan pemeriksaan
sebelum deployment. Branch `codex/staging` digunakan untuk staging dan `main`
untuk production. Deployment staging memerlukan variable `STAGING_READY=true`.
Staging memakai Worker dan project Supabase terpisah serta dilindungi Cloudflare Access.

Credential deployment disimpan di GitHub Environment Secrets. Credential server
aplikasi juga harus tersedia sebagai Worker Secrets di environment yang sesuai.
Verifikasi staging menggunakan `CF_ACCESS_CLIENT_ID` dan `CF_ACCESS_CLIENT_SECRET`.

## Data dan konfigurasi

- [`data/menu.json`](data/menu.json) menyimpan katalog awal; harga checkout
  dihitung di server dari database.
- [`supabase/`](supabase/) berisi skema, migrasi, dan kebijakan akses database.
- [`wrangler.toml`](wrangler.toml) mengatur Worker dan binding Cloudflare.
- [`.env.example`](.env.example) mendokumentasikan variabel konfigurasi tanpa
  credential server.

Variabel berprefix `NEXT_PUBLIC_` dapat masuk ke bundle browser. Jangan gunakan
prefix tersebut untuk service-role key, API secret, atau credential admin.
