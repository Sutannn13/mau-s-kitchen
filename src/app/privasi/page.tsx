import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { getOrderRetentionDays } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Cara MAU'S Kitchen menggunakan dan melindungi data pesanan pelanggan.",
};

export default function PrivacyPage() {
  const retentionDays = getOrderRetentionDays();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-6 pt-6 md:px-8 md:pb-16 md:pt-12">
      <h1 className="font-serif text-3xl font-bold text-brown-deep">
        Kebijakan Privasi
      </h1>
      <p className="mt-3 text-sm leading-6 text-brown/75">
        MAU&apos;S Kitchen menggunakan data seperlunya untuk menerima,
        menyiapkan, mengantar, mengonfirmasi pembayaran, dan menangani
        pertanyaan terkait pesanan.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-brown/80">
        <section>
          <h2 className="text-lg font-bold text-brown-deep">Data yang diproses</h2>
          <p className="mt-2">
            Nama, nomor WhatsApp, pilihan menu, alamat dan catatan pengantaran
            bila diperlukan, jadwal, metode pembayaran, serta gambar bukti
            pembayaran bila pelanggan mengunggahnya.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-brown-deep">Penggunaan dan akses</h2>
          <p className="mt-2">
            Data hanya digunakan untuk operasional pesanan dan dapat diakses
            admin yang diberi wewenang. Infrastruktur hosting, Supabase, dan
            WhatsApp dapat memproses data sesuai fungsi layanan masing-masing;
            data tidak dijual untuk pemasaran pihak lain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-brown-deep">Masa penyimpanan</h2>
          <p className="mt-2">
            {retentionDays === null
              ? "Masa penyimpanan belum ditetapkan. Pemesanan online dinonaktifkan sampai pemilik menetapkannya."
              : `Data pesanan dan bukti pembayaran disimpan maksimal ${retentionDays} hari, lalu dihapus melalui proses retensi berkala.`}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-brown-deep">Hak pelanggan</h2>
          <p className="mt-2">
            Pelanggan dapat meminta informasi, koreksi, atau penghapusan data
            dengan menghubungi WhatsApp MAU&apos;S Kitchen di{" "}
            {siteConfig.whatsappDisplay}. Permintaan dapat memerlukan verifikasi
            agar data tidak diberikan kepada orang lain.
          </p>
        </section>

        <p className="rounded-xl bg-gold/10 px-4 py-3 text-xs leading-5">
          Terakhir diperbarui: 16 Agustus 2026.
        </p>
      </div>
    </main>
  );
}
