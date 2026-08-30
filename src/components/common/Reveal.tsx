import type { ReactNode } from "react";

// Wrapper statis. Observer Motion dihapus dari halaman publik karena setiap
// instance menambah hydration dan kerja main-thread pada HP kelas rendah.
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
