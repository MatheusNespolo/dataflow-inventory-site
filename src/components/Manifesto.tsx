"use client";
// Parágrafo-manifesto: cada palavra acende conforme a rolagem (GSAP scrub).
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

const TEXTO =
  "Um centro de distribuição inteiro cabe numa bancada. Quatro esteiras, seis sensores e dois microcontroladores provam, em escala reduzida, o que a intralogística faz em escala real: pedido, decisão, movimento e confirmação. Nenhuma peça é debitada no escuro.";

const DESTAQUES = new Set(["bancada.", "pedido,", "decisão,", "movimento", "confirmação.", "escuro."]);

export default function Manifesto() {
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-palavra]",
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: raiz.current, start: "top 70%", end: "bottom 60%", scrub: true },
          },
        );
      });
    },
    { scope: raiz },
  );

  return (
    <section id="manifesto" ref={raiz} className="relative z-10 px-4 py-40 sm:px-8 sm:py-56">
      <div className="mx-auto max-w-6xl">
        <p className="mb-10 font-mono text-xs tracking-[0.3em] text-violet-hi uppercase">{"// O projeto"}</p>
        <p className="font-display text-[clamp(1.9rem,4.6vw,4.4rem)] leading-[1.08] font-semibold tracking-[-0.025em]">
          {TEXTO.split(" ").map((p, i) => (
            <span key={i} data-palavra className={`inline-block pr-[0.25em] ${DESTAQUES.has(p) ? "text-violet-hi" : "text-paper"}`}>
              {p}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
