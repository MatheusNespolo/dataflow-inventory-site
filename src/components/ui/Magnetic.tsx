"use client";
// Botão/link "magnético": acompanha o ponteiro com mola e volta ao centro ao sair.
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

type Props = {
  href: string;
  children: ReactNode;
  variante?: "solido" | "contorno";
  externo?: boolean;
  className?: string;
};

export function MagneticLink({ href, children, variante = "solido", externo, className = "" }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduz = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 14, mass: 0.4 });

  const mover = (e: React.PointerEvent) => {
    if (reduz || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.3);
    y.set((e.clientY - r.top - r.height / 2) * 0.35);
  };
  const soltar = () => {
    x.set(0);
    y.set(0);
  };

  const estilo =
    variante === "solido"
      ? "bg-violet text-white shadow-[0_0_0_1px_rgb(169_112_255/0.6),0_18px_60px_-12px_rgb(139_61_255/0.75)] hover:bg-[#9a55ff]"
      : "border border-line bg-ink/40 text-paper backdrop-blur hover:border-violet-hi hover:text-white";

  return (
    <motion.a
      ref={ref}
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerMove={mover}
      onPointerLeave={soltar}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      className={`group relative inline-flex min-h-12 cursor-pointer items-center gap-3 overflow-hidden rounded-full px-7 py-3.5 font-display text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${estilo} ${className}`}
    >
      {/* Brilho que atravessa o botão no hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-full group-hover:opacity-100"
      />
      <span className="relative flex items-center gap-3">{children}</span>
    </motion.a>
  );
}
