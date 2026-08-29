import Image from "next/image";

import { Reveal } from "@/components/common/Reveal";

export function KitchenStorySection() {
  return (
    <section className="relative overflow-hidden bg-cream py-14 md:py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 lg:order-1" y={20}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#EAE3DB] bg-white shadow-warm sm:aspect-[4/3] lg:aspect-[4/3]">
              <Image
                src="/assets/stitch/kitchen-story.jpg"
                alt="Suasana dapur MAU'S Kitchen dengan bahan-bahan segar pilihan"
                fill
                quality={80}
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brown">
                Kisah Dapur
              </p>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brown-deep sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
                Cerita dari Dapur Kami
              </h2>
            </Reveal>

            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-brown/85 sm:text-base md:space-y-5">
              <Reveal delay={0.1}>
                <p>Berawal dari kecintaan pada rasa yang jujur, MAU&apos;S Kitchen hadir untuk menyajikan hidangan yang terasa seperti pelukan hangat dari rumah. Kami percaya bahwa makanan yang baik bermula dari bahan-bahan berkualitas dan proses yang penuh perhatian.</p>
              </Reveal>
              <Reveal delay={0.2}>
                <p>Setiap tusuk Sate Taichan kami marinasi dengan bumbu pilihan, dipanggang perlahan hingga mencapai tingkat kelembutan yang pas. Setiap gelas Choco Berry kami racik dengan menyeimbangkan rasa manis alami dan cokelat berkualitas tinggi.</p>
              </Reveal>
              <Reveal delay={0.3}>
                <p>Bukan sekadar makanan dan minuman, kami ingin menghadirkan momen kecil yang membahagiakan di tengah kesibukan Anda. Manisnya bikin senyum, pedasnya bikin nagih.</p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
