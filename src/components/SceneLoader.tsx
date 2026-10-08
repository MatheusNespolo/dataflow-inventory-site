"use client";
// A cena WebGL só existe no navegador: carrega depois da primeira pintura, sem SSR.
import dynamic from "next/dynamic";

const Experience = dynamic(() => import("./scene/Experience"), { ssr: false });

export default function SceneLoader() {
  return <Experience />;
}
