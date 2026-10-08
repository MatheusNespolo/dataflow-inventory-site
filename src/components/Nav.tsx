"use client";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { links } from "@/lib/content";
import { IconGithub } from "./ui/Icons";
import { LogoMark } from "./ui/Logo";

const itens = [
  { href: "#historia", rotulo: "Como funciona" },
  { href: "#arquitetura", rotulo: "Arquitetura" },
  { href: "#tecnologia", rotulo: "Tecnologia" },
  { href: "#comecar", rotulo: "Começar" },
];

export default function Nav() {
  const { scrollY } = useScroll();
  const [rolou, setRolou] = useState(false);
  const [oculta, setOculta] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const anterior = scrollY.getPrevious() ?? 0;
    setRolou(y > 40);
    // Some ao descer, volta ao subir (mais espaço para a história).
    setOculta(y > 600 && y > anterior);
  });

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: oculta ? -96 : 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"
    >
      <nav
        aria-label="Principal"
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border px-3 py-2 pl-4 transition-colors duration-300 ${
          rolou ? "border-line bg-ink/70 backdrop-blur-xl" : "border-transparent bg-transparent"
        }`}
      >
        <a href="#inicio" className="flex min-h-11 items-center gap-2.5 rounded-full pr-2" aria-label="Data Flow Inventory — início">
          <LogoMark className="h-7 w-8" />
          <span className="font-display text-sm font-bold tracking-[0.18em] uppercase">Data Flow</span>
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {itens.map((i) => (
            <li key={i.href}>
              <a
                href={i.href}
                className="relative inline-flex min-h-11 items-center rounded-full px-4 text-sm text-mute transition-colors duration-200 hover:text-paper"
              >
                {i.rotulo}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={links.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-5 font-display text-xs font-bold tracking-widest text-ink uppercase transition-transform duration-200 hover:scale-[1.04] active:scale-95"
        >
          <IconGithub className="size-4" />
          <span>Repositório</span>
        </a>
      </nav>
    </motion.header>
  );
}
