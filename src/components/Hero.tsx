"use client";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { estadosFsm, links } from "@/lib/content";
import { IconArrowDown, IconGithub } from "./ui/Icons";
import { MagneticLink } from "./ui/Magnetic";
import { SplitReveal } from "./ui/SplitReveal";

/** Leitura da FSM no canto do hero — é um ciclo simulado, e diz isso. */
function LeituraFsm() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % 4), 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="rounded-2xl border border-line bg-ink/60 p-4 font-mono text-xs backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-6 text-mute">
        <span className="tracking-[0.2em]">FSM · ARDUINO UNO</span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-hi opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-violet-hi" />
          </span>
          ciclo simulado
        </span>
      </div>
      <div className="h-5 overflow-hidden text-sm text-paper" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {estadosFsm[i]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${k <= i ? "bg-violet" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const raiz = useRef<HTMLElement>(null);

  // Parallax de saída: o título sobe mais rápido que a rolagem e perde opacidade.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-hero-titulo]", {
          yPercent: -35,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: { trigger: raiz.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-hero-lateral]", {
          y: -120,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: raiz.current, start: "top top", end: "60% top", scrub: true },
        });
      });
    },
    { scope: raiz },
  );

  return (
    <section id="inicio" ref={raiz} className="relative z-10 flex min-h-[100svh] flex-col justify-between px-4 pt-28 pb-8 sm:px-8">
      {/* Coluna superior: contexto + leitura */}
      <div data-hero-lateral className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="max-w-xs font-mono text-xs leading-relaxed tracking-[0.18em] text-mute uppercase"
        >
          SENAI São Caetano do Sul
          <br />
          Engenharia de Controle e Automação
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }} className="hidden w-64 sm:block">
          <LeituraFsm />
        </motion.div>
      </div>

      {/* Título gigante */}
      <div className="mx-auto w-full max-w-7xl">
        <h1 data-hero-titulo className="font-display leading-[0.82] font-bold tracking-[-0.045em] uppercase">
          <SplitReveal texto="Data Flow" className="block text-[clamp(3.6rem,15.5vw,15.5rem)] text-paper" atraso={0.2} />
          <SplitReveal texto="Inventory" className="text-glow block text-[clamp(3.6rem,15.5vw,15.5rem)] text-violet-hi" atraso={0.45} />
        </h1>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl text-lg leading-relaxed text-mute sm:text-xl"
          >
            <span className="text-paper">Do clique no navegador à esteira em movimento.</span> Um centro de distribuição automatizado em escala reduzida — Arduino, ESP32, MQTT e um dashboard em tempo real.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-3"
          >
            <MagneticLink href="#historia">
              Ver o caminho de um pedido
              <IconArrowDown />
            </MagneticLink>
            <MagneticLink href={links.repo} variante="contorno" externo>
              <IconGithub className="size-4" />
              Código-fonte
            </MagneticLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
