"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";

// Animasi "terbang ke keranjang" (docs/08_UI_UX_SPEC.md §8.3): saat item
// ditambahkan, thumbnail produk meluncur melengkung dari tombol Tambah ke
// ikon keranjang di Header (elemen bertanda data-cart-target) lalu mengecil
// seolah masuk — disambut pop badge CartBadge. Titik awal/akhir dibaca dari
// getBoundingClientRect saat klik, jadi provider tidak perlu tahu layout.
interface CartFly {
  flyFromElement: (element: Element, image?: string) => void;
}

interface Flight {
  id: number;
  image?: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const noopFly: CartFly = {
  flyFromElement: () => {},
};

const CartFlyContext = createContext<CartFly>(noopFly);

// Aman dipakai di halaman tanpa provider (mis. rute admin): jadi no-op.
export function useCartFly(): CartFly {
  return useContext(CartFlyContext);
}

const DOT_SIZE = 40;

export function CartFlyProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<readonly Flight[]>([]);
  const nextIdRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const flyFromElement = useCallback(
    (element: Element, image?: string) => {
      // reducedMotion="user" di MotionConfig melucuti transform animasi;
      // lebih baik di-skip total supaya tidak ada titik diam menggantung.
      if (prefersReducedMotion) {
        return;
      }
      const target = document.querySelector("[data-cart-target]");
      if (!target) {
        return;
      }
      const from = element.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      if (from.width === 0 || to.width === 0) {
        return;
      }
      nextIdRef.current += 1;
      const flight: Flight = {
        id: nextIdRef.current,
        image: image || undefined,
        x: from.left + from.width / 2,
        y: from.top + from.height / 2,
        targetX: to.left + to.width / 2,
        targetY: to.top + to.height / 2,
      };
      setFlights((current) => [...current, flight]);
    },
    [prefersReducedMotion],
  );

  const finishFlight = useCallback((id: number) => {
    setFlights((current) => current.filter((flight) => flight.id !== id));
  }, []);

  return (
    <CartFlyContext.Provider value={{ flyFromElement }}>
      {children}
      {flights.map((flight) => (
        <FlyDot key={flight.id} flight={flight} onDone={finishFlight} />
      ))}
    </CartFlyContext.Provider>
  );
}

function FlyDot({
  flight,
  onDone,
}: {
  flight: Flight;
  onDone: (id: number) => void;
}) {
  // Titik kendali lengkung diangkat 90px di atas garis lurus — busur khas
  // "lemparan" ke keranjang; masuk dengan mengecil ke 20% di paruh akhir.
  const midX = (flight.x + flight.targetX) / 2;
  const midY = Math.min(flight.y, flight.targetY) - 90;
  const half = DOT_SIZE / 2;

  return (
    <motion.div
      aria-hidden="true"
      initial={{
        x: flight.x - half,
        y: flight.y - half,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: [flight.x - half, midX - half, flight.targetX - half],
        y: [flight.y - half, midY - half, flight.targetY - half],
        scale: [1, 0.85, 0.2],
        opacity: [1, 1, 0.85],
      }}
      transition={{
        duration: 0.6,
        times: [0, 0.5, 1],
        ease: ["easeOut", "easeIn"],
      }}
      onAnimationComplete={() => {
        onDone(flight.id);
      }}
      className="pointer-events-none fixed left-0 top-0 z-toast flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-gold bg-cream shadow-warm-lg"
    >
      {flight.image ? (
        <Image
          src={flight.image}
          alt=""
          fill
          quality={60}
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <Plus aria-hidden="true" className="size-5 text-brown-deep" strokeWidth={2.5} />
      )}
    </motion.div>
  );
}
