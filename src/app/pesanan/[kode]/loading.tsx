import { KitchenLoader } from "@/components/common/KitchenLoader";

// Placeholder berbentuk struk (force-dynamic route — loader ini tampil saat
// server mengambil data pesanan). Cermin struktur page.tsx Batch 7: stub
// gelap → perforasi/notch → badan krem → tepi sobek, agar transisi masuk
// halaman terasa mulus tanpa layout shift besar.
export default function LoadingPesanan() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <div className="mx-auto max-w-2xl">
        <div className="animate-reveal motion-reduce:animate-none relative mt-3">
          <div className="h-40 rounded-t-[1.75rem] bg-ink-soft shadow-warm-lg" />
          <div className="relative border-x border-gold/20 bg-[color:var(--surface)] px-5 pb-12 pt-8 shadow-warm md:px-7">
            <span
              aria-hidden="true"
              className="absolute -left-2.5 -top-2.5 size-5 rounded-full bg-[color:var(--surface-page)]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-2.5 -top-2.5 size-5 rounded-full bg-[color:var(--surface-page)]"
            />
            <KitchenLoader label="Menyiapkan struk pesanan" />
          </div>
          <div
            aria-hidden="true"
            className="receipt-tear border-x border-gold/20"
          />
        </div>
      </div>
    </main>
  );
}
