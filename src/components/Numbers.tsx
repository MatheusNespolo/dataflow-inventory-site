"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { numeros } from "@/lib/content";

const fmt = (n: number, casas: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default function Numbers() {
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-contador]").forEach((el) => {
          const alvo = Number(el.dataset.valor);
          const casas = Number(el.dataset.casas);
          const obj = { n: 0 };
          gsap.to(obj, {
            n: alvo,
            duration: 1.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
            onUpdate: () => { el.textContent = fmt(obj.n, casas); },
          });
        });
        gsap.from("[data-cartao-numero]", {
          y: 60,
          opacity: 0,
          stagger: 0.08,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: raiz.current, start: "top 75%" },
        });
      });
    },
    { scope: raiz },
  );

  return (
    <section ref={raiz} className="relative z-10 px-4 py-32 sm:px-8" aria-labelledby="numeros-titulo">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 id="numeros-titulo" className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.88] font-bold tracking-[-0.04em] uppercase">
            Em <span className="text-violet-hi">números</span>
          </h2>
          <p className="max-w-sm text-mute">Hardware de bancada, software de produção. Cada número abaixo está no código e na documentação do repositório.</p>
        </div>
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {numeros.map((n) => {
            const casas = Number.isInteger(n.valor) ? 0 : 1;
            return (
              <li key={n.rotulo} data-cartao-numero className="group relative bg-ink-2 p-8 transition-colors duration-300 hover:bg-ink-3 sm:p-10">
                <p className="font-display text-[clamp(4rem,9vw,7rem)] leading-none font-bold tracking-[-0.05em] text-paper tabular-nums">
                  <span data-contador data-valor={n.valor} data-casas={casas}>
                    {fmt(n.valor, casas)}
                  </span>
                  <span className="text-violet-hi">{n.sufixo}</span>
                </p>
                <p className="mt-4 font-display text-lg font-semibold tracking-wide uppercase">{n.rotulo}</p>
                <p className="mt-1 text-sm text-mute">{n.detalhe}</p>
                <span aria-hidden="true" className="absolute top-8 right-8 size-2 rounded-full bg-line transition-colors duration-300 group-hover:bg-violet-hi group-hover:shadow-[0_0_16px_4px_rgb(139_61_255/0.6)]" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
