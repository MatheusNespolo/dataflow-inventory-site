"use client";
// Faixa com os estados da FSM, chamada final para o repositório e rodapé.
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { equipe, estadosFsm, links, orientacao, quickStart } from "@/lib/content";
import { IconArrowRight, IconCheck, IconCopy, IconGithub } from "./ui/Icons";
import { LogoMark } from "./ui/Logo";
import { MagneticLink } from "./ui/Magnetic";
import { SplitReveal } from "./ui/SplitReveal";

export function FsmMarquee() {
  const faixa = [...estadosFsm, ...estadosFsm];
  return (
    <section aria-label="Estados da máquina de estados" className="relative z-10 overflow-hidden border-y border-line bg-ink-2 py-8">
      <div className="animate-marquee flex w-max gap-12 whitespace-nowrap" aria-hidden="true">
        {faixa.map((e, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold tracking-[-0.03em]">
            <span className={i % 2 ? "text-outline" : "text-paper"}>{e}</span>
            <span className="size-3 rotate-45 bg-violet" />
          </span>
        ))}
      </div>
      <p className="sr-only">Estados: {estadosFsm.join(", ")}.</p>
    </section>
  );
}

function BlocoComando() {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(quickStart.join("\n"));
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-xs text-mute">simulador · sem hardware</span>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 font-mono text-xs text-mute transition-colors hover:bg-ink-3 hover:text-paper"
          aria-label={copiado ? "Comandos copiados" : "Copiar comandos"}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copiado ? "ok" : "copiar"}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2"
            >
              {copiado ? <IconCheck className="size-4 text-violet-hi" /> : <IconCopy />}
              {copiado ? "copiado" : "copiar"}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-sm leading-7">
        {quickStart.map((l) => (
          <div key={l}>
            <span className="text-violet-hi select-none">$ </span>
            <span className="text-paper">{l}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function Cta() {
  return (
    <section id="comecar" className="relative z-10 overflow-hidden px-4 pt-40 pb-24 sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/2 h-[42rem] w-[64rem] -translate-x-1/2 rounded-full bg-violet/25 blur-[140px]" />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-8 font-mono text-xs tracking-[0.3em] text-violet-hi uppercase">{"// Agora, por dentro"}</p>
        <h2 className="font-display text-[clamp(3.2rem,11vw,11rem)] leading-[0.85] font-bold tracking-[-0.045em] uppercase">
          <SplitReveal texto="Veja como" className="block" aoVer />
          <SplitReveal texto="funciona de" className="block" aoVer atraso={0.15} />
          <SplitReveal texto="verdade." className="text-glow block text-violet-hi" aoVer atraso={0.3} />
        </h2>

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="max-w-lg text-lg leading-relaxed text-mute">
              Esta página é a vitrine. O repositório tem tudo: firmware, servidor, dashboard, diagramas elétricos, roteiros de teste e o guia para montar a bancada do zero. Comece pelo simulador — 30 segundos e nenhum hardware.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MagneticLink href={links.repo} externo>
                <IconGithub className="size-4" />
                Abrir o repositório
              </MagneticLink>
              <MagneticLink href={links.implantacao} variante="contorno" externo>
                Montar a bancada
                <IconArrowRight />
              </MagneticLink>
            </div>
          </div>
          <BlocoComando />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-ink px-4 pt-16 pb-10 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-10" />
            <span className="font-display text-lg font-bold tracking-[0.16em] uppercase">Data Flow Inventory</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mute">
            Projeto de pesquisa em Engenharia de Controle e Automação — SENAI São Caetano do Sul, unidade Boa Vista.
          </p>
        </div>
        <div>
          <h3 className="font-mono text-xs tracking-[0.25em] text-violet-hi uppercase">Equipe</h3>
          <ul className="mt-4 space-y-1.5 text-sm text-paper">
            {equipe.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-mono text-xs tracking-[0.25em] text-violet-hi uppercase">Orientação</h3>
          <ul className="mt-4 space-y-1.5 text-sm text-paper">
            {orientacao.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-16 flex max-w-7xl flex-col justify-between gap-4 border-t border-line pt-6 font-mono text-xs text-mute sm:flex-row">
        <p>© 2026 Data Flow Inventory · <a className="underline-offset-4 hover:text-paper hover:underline" href={links.licenca} target="_blank" rel="noopener noreferrer">Licença MIT</a></p>
        <p>
          Modelo 3D ilustrativo, gerado em código a partir da bancada real.{" "}
          <a className="underline-offset-4 hover:text-paper hover:underline" href={links.repo} target="_blank" rel="noopener noreferrer">github.com/MatheusNespolo/DataFlowInventory</a>
        </p>
      </div>
    </footer>
  );
}
