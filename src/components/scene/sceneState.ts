// Estado mutável compartilhado entre a rolagem (GSAP ScrollTrigger) e a cena 3D (useFrame).
// É um objeto simples de propósito: a cena lê a cada quadro sem re-renderizar o React.

export const sceneState = {
  /** 0 → topo da página; 1 → hero saiu da tela. */
  heroOut: 0,
  /** 0 → câmera livre do hero; 1 → câmera presa aos capítulos da história. */
  storyMix: 0,
  /** Posição contínua na história: 0 … CAPITULOS (capítulo atual = floor). */
  story: 0,
  /** Opacidade da cena (0 → pode parar de renderizar). */
  visibility: 1,
  /** Ponteiro normalizado (-1 … 1), para o parallax do hero. */
  pointer: { x: 0, y: 0 },
  /** prefers-reduced-motion: congela giro, vapor e esteiras automáticas. */
  reducedMotion: false,
};

export type SceneState = typeof sceneState;
