"use client";
// "O caminho de um pedido": seção alta com painel fixo (sticky). A rolagem avança os
// capítulos, move a câmera da cena 3D (sceneState.story) e troca o texto.
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import { capitulos } from "@/lib/content";
import { sceneState } from "./scene/sceneState";

const N = capitulos.length;

export default function Story() {
  const raiz = useRef<HTMLElement>(null);
  const barra = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: raiz.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (st) => {
          const s = Math.min(st.progress * N, N - 0.001);
          sceneState.story = s;
          setAtual(Math.floor(s));
          if (barra.current) barra.current.style.transform = `scaleY(${st.progress})`;
        },
      });
    },
    { scope: raiz },
  );

  const c = capitulos[atual];

  return (
    <section id="historia" ref={raiz} className="relative z-10" style={{ height: `${N * 100 + 40}vh` }} aria-label="O caminho de um pedido">
      <div className="sticky top-0 flex h-[100svh] items-end overflow-hidden px-4 pb-10 sm:items-center sm:px-8 sm:pb-0">
        {/* Escurece só a lateral do texto, para a cena seguir visível à direita */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent sm:bg-gradient-to-r sm:from-ink/95 sm:via-ink/50 sm:to-transparent" />

        <div className="relative mx-auto flex w-full max-w-7xl gap-8 sm:gap-14">
          {/* Trilho de progresso */}
          <div className="relative hidden w-px shrink-0 bg-line sm:block" aria-hidden="true">
            <div ref={barra} className="absolute inset-0 origin-top bg-violet-hi" style={{ transform: "scaleY(0)" }} />
          </div>

          <div className="max-w-xl">
            <p className="mb-6 font-mono text-xs tracking-[0.3em] text-violet-hi uppercase">{"// O caminho de um pedido"}</p>

            <div className="relative min-h-[22rem] sm:min-h-[26rem]">
              <AnimatePresence mode="wait">
                <motion.article
                  key={c.id}
                  initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-baseline gap-4">
                    <span className="text-outline font-display text-[clamp(5rem,13vw,10rem)] leading-none font-bold">{c.codigo}</span>
                    <span className="font-mono text-xs tracking-[0.2em] text-mute uppercase">{c.tag}</span>
                  </div>
                  <h2 className="mt-2 font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.95] font-bold tracking-[-0.03em] uppercase">
                    {c.titulo}
                  </h2>
                  <p className="mt-6 text-lg leading-relaxed text-mute sm:text-xl">{c.texto}</p>
                </motion.article>
              </AnimatePresence>
            </div>

            {/* Marcadores dos capítulos (estado atual anunciado para leitores de tela) */}
            <ol className="mt-8 flex gap-2" aria-label="Capítulos">
              {capitulos.map((cap, i) => (
                <li key={cap.id} aria-current={i === atual ? "step" : undefined} className="flex-1">
                  <span className="sr-only">{`${cap.codigo} ${cap.titulo}`}</span>
                  <span
                    aria-hidden="true"
                    className={`block h-1 rounded-full transition-all duration-500 ${i < atual ? "bg-violet" : i === atual ? "bg-violet-hi" : "bg-line"}`}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
