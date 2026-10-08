"use client";
// Revela um texto letra a letra, subindo de dentro de uma máscara (Framer Motion).
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  texto: string;
  className?: string;
  atraso?: number;
  /** Revela ao entrar na tela (true) ou logo ao montar (false). */
  aoVer?: boolean;
};

export function SplitReveal({ texto, className = "", atraso = 0, aoVer = false }: Props) {
  const reduz = useReducedMotion();
  const palavras = texto.split(" ");
  let indice = 0;
  const gatilho = aoVer
    ? { initial: "oculto", whileInView: "visivel", viewport: { once: true, amount: 0.6 } }
    : { initial: "oculto", animate: "visivel" };

  return (
    <span className={className} aria-label={texto} role="text">
      <motion.span {...gatilho} transition={{ staggerChildren: 0.035, delayChildren: atraso }} aria-hidden="true" className="inline">
        {palavras.map((p, pi) => (
          <span key={pi} className="inline-block whitespace-nowrap">
            {Array.from(p).map((letra) => {
              const i = indice++;
              return (
                <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span
                    className="inline-block"
                    variants={{
                      oculto: reduz ? { opacity: 0 } : { y: "110%", rotate: 8 },
                      visivel: reduz ? { opacity: 1 } : { y: "0%", rotate: 0 },
                    }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {letra}
                  </motion.span>
                </span>
              );
            })}
            {pi < palavras.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
