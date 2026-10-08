"use client";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { destaques } from "@/lib/content";
import { IconActivity, IconCpu, IconFlask, IconGauge, IconShield, IconWifi } from "./ui/Icons";

const ICONES = [IconGauge, IconCpu, IconWifi, IconActivity, IconShield, IconFlask];

/** Cartão com holofote que segue o cursor e leve inclinação 3D. */
function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduz = useReducedMotion();
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const rx = useSpring(0, { stiffness: 160, damping: 18 });
  const ry = useSpring(0, { stiffness: 160, damping: 18 });
  const luz = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgb(139 61 255 / 0.22), transparent 65%)`;

  return (
    <motion.li
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
        if (reduz || e.pointerType !== "mouse") return;
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 6);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
      }}
      onPointerLeave={() => {
        mx.set(-400);
        my.set(-400);
        rx.set(0);
        ry.set(0);
      }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`group bg-brushed relative overflow-hidden rounded-3xl border border-line p-8 transition-colors duration-300 hover:border-violet/60 ${className}`}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: luz }} />
      <div className="relative flex h-full flex-col">{children}</div>
    </motion.li>
  );
}

export default function Highlights() {
  return (
    <section id="tecnologia" className="relative z-10 px-4 py-32 sm:px-8" aria-labelledby="tec-titulo">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 font-mono text-xs tracking-[0.3em] text-violet-hi uppercase">{"// Destaques técnicos"}</p>
        <h2 id="tec-titulo" className="mb-16 max-w-5xl font-display text-[clamp(2.6rem,6.5vw,6rem)] leading-[0.92] font-bold tracking-[-0.035em] uppercase">
          Feito para <span className="text-violet-hi">não falhar</span> em silêncio
        </h2>
        <ul className="grid auto-rows-fr gap-4 md:grid-cols-3">
          {destaques.map((d, i) => {
            const Icone = ICONES[i];
            const grande = "grande" in d && d.grande;
            return (
              <Cartao key={d.titulo} className={grande ? "md:col-span-2" : ""}>
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-line bg-ink/60 text-violet-hi transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <Icone />
                  </span>
                  <span className="rounded-full border border-line px-3 py-1 font-mono text-xs text-mute">{d.detalhe}</span>
                </div>
                <h3 className={`mt-10 font-display font-bold tracking-tight uppercase ${grande ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{d.titulo}</h3>
                <p className="mt-3 max-w-xl leading-relaxed text-mute">{d.texto}</p>
              </Cartao>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
