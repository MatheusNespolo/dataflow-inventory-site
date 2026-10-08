"use client";
// Fluxo de arquitetura: a linha se desenha com a rolagem e um "pacote" percorre os nós.
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useRef } from "react";
import { arquitetura, links } from "@/lib/content";
import { IconArrowUpRight } from "./ui/Icons";

export default function Architecture() {
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-fluxo]", start: "top 75%", end: "bottom 45%", scrub: 0.8 },
        });
        tl.fromTo("[data-linha]", { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
        tl.fromTo("[data-linha-v]", { scaleY: 0 }, { scaleY: 1, ease: "none" }, 0);
        gsap.utils.toArray<HTMLElement>("[data-no]").forEach((el, i, todos) => {
          tl.fromTo(el, { opacity: 0.25 }, { opacity: 1, duration: 0.15 }, (i / todos.length) * 0.9);
        });
      });
    },
    { scope: raiz },
  );

  return (
    <section id="arquitetura" ref={raiz} className="relative z-10 px-4 py-32 sm:px-8" aria-labelledby="arq-titulo">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 font-mono text-xs tracking-[0.3em] text-violet-hi uppercase">{"// Arquitetura"}</p>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 id="arq-titulo" className="max-w-4xl font-display text-[clamp(2.6rem,6.5vw,6rem)] leading-[0.92] font-bold tracking-[-0.035em] uppercase">
            Seis camadas, <span className="text-outline">um contrato</span>
          </h2>
          <a
            href={links.arquitetura}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center gap-2 font-mono text-sm text-mute transition-colors hover:text-paper"
          >
            docs/ARCHITECTURE.md
            <IconArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
        <p className="mt-6 max-w-2xl text-lg text-mute">
          Um comando atravessa seis camadas e o evento volta pelo mesmo caminho. No modo simulador, as três últimas são trocadas por uma máquina de estados em JavaScript que emite exatamente os mesmos eventos.
        </p>

        <div data-fluxo className="relative mt-20">
          {/* Linha horizontal (desktop) e vertical (celular) */}
          <div aria-hidden="true" className="absolute top-[2.75rem] right-[8%] left-[8%] hidden h-px bg-line lg:block">
            <div data-linha className="h-full origin-left bg-gradient-to-r from-violet via-violet-hi to-orchid" />
            <motion.span
              className="absolute -top-[5px] size-[11px] rounded-full bg-lilac shadow-[0_0_18px_6px_rgb(169_112_255/0.8)] motion-reduce:hidden"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.6 }}
            />
          </div>
          <div aria-hidden="true" className="absolute top-0 bottom-0 left-[1.6rem] w-px bg-line lg:hidden">
            <div data-linha-v className="h-full w-full origin-top bg-gradient-to-b from-violet via-violet-hi to-orchid" />
          </div>

          <ol className="relative grid gap-10 lg:grid-cols-6 lg:gap-4">
            {arquitetura.map((n, i) => (
              <li key={n.nome} data-no className="flex items-start gap-5 lg:flex-col lg:items-center lg:text-center">
                <span className="relative z-10 flex size-[3.2rem] shrink-0 items-center justify-center rounded-2xl border border-line bg-ink-2 font-mono text-sm text-violet-hi shadow-[0_0_0_6px_var(--color-ink)] lg:size-[5.5rem] lg:rounded-3xl lg:text-base">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="lg:mt-5">
                  <p className="font-display text-xl font-bold tracking-tight uppercase">{n.nome}</p>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-mute">{n.papel}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
