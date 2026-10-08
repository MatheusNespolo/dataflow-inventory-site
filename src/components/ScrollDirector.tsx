"use client";
// Rolagem suave (Lenis) sincronizada com o GSAP ScrollTrigger, e o mapeamento
// rolagem → sceneState (câmera, capítulo e visibilidade da cena 3D).
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";
import { sceneState } from "./scene/sceneState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollDirector() {
  useEffect(() => {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sceneState.reducedMotion = reduz;
    if (reduz) return;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Âncoras internas passam pelo Lenis (rolagem suave até a seção).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const alvo = document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      lenis.scrollTo(alvo as HTMLElement, { offset: 0 });
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useGSAP(() => {
    let dimManifesto = 0;
    let entradaHistoria = 0;
    let saidaHistoria = 0;
    const atualizarVisibilidade = () => {
      let vis = 1 - 0.8 * dimManifesto;
      vis += (1 - vis) * entradaHistoria;
      sceneState.visibility = vis * (1 - saidaHistoria);
    };

    ScrollTrigger.create({
      trigger: "#inicio",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (st) => { sceneState.heroOut = st.progress; },
    });
    ScrollTrigger.create({
      trigger: "#manifesto",
      start: "top 80%",
      end: "top 20%",
      scrub: true,
      onUpdate: (st) => { dimManifesto = st.progress; atualizarVisibilidade(); },
    });
    ScrollTrigger.create({
      trigger: "#historia",
      start: "top bottom",
      end: "top top",
      scrub: true,
      onUpdate: (st) => {
        entradaHistoria = st.progress;
        sceneState.storyMix = st.progress;
        atualizarVisibilidade();
      },
    });
    ScrollTrigger.create({
      trigger: "#historia",
      start: "bottom bottom",
      end: "bottom 30%",
      scrub: true,
      onUpdate: (st) => { saidaHistoria = st.progress; atualizarVisibilidade(); },
    });
  });

  return null;
}
