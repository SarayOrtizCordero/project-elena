import { cn } from "@elena/ui";

/** Generador determinista (mismo resultado en servidor y cliente). */
function path(seed: number, steps = 56) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let d = "M0,40 L0,18";
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * 1000;
    const y = 4 + rnd() * 20 + (i % 3 === 0 ? 6 : 0);
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + " L1000,40 Z";
}

const shapes = [path(7), path(19), path(43)];

/**
 * Borde de papel rasgado. Se coloca dentro de una sección con `relative` y dibuja,
 * justo encima de ella, un corte irregular del color de esa sección (`text-*`).
 */
export function TornEdge({ className, variant = 0 }: { className?: string; variant?: 0 | 1 | 2 }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 40"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-x-0 top-px h-5 w-full -translate-y-full fill-current sm:h-8", className)}
    >
      <path d={shapes[variant]} />
    </svg>
  );
}
