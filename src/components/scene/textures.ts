// Texturas procedurais (canvas 2D) — nada é baixado da rede.
import * as THREE from "three";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  return { c, ctx };
}

/**
 * Lona de borracha da esteira. O eixo U da textura corre ao longo da esteira (as nervuras
 * são verticais no canvas), então o movimento é só animar offset.x.
 */
export function beltTexture() {
  const { c, ctx } = canvas(256, 128);
  ctx.fillStyle = "#26222c";
  ctx.fillRect(0, 0, 256, 128);
  // Ruído fino da borracha.
  const img = ctx.getImageData(0, 0, 256, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n + 2;
  }
  ctx.putImageData(img, 0, 0);
  // Nervuras transversais.
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = "#3a3443";
    ctx.fillRect(x, 0, 10, 128);
    ctx.fillStyle = "#121015";
    ctx.fillRect(x + 10, 0, 2, 128);
  }
  // Faixa central lilás (referência visual de movimento).
  ctx.fillStyle = "rgba(169, 112, 255, 0.55)";
  ctx.fillRect(0, 60, 256, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Estados da FSM, na ordem dos ícones da faixa inferior do OLED. */
export const ESTADOS_OLED = ["AGUARDANDO", "VERIFICANDO", "ACIONANDO", "ENTREGANDO", "ERRO"] as const;
export type EstadoOled = (typeof ESTADOS_OLED)[number];

/** Ícones 16x16 da faixa de estados do firmware ('#' = pixel aceso). */
const ICONES: Record<EstadoOled, string[]> = {
  AGUARDANDO: [ // ampulheta
    "################", "################", ".#............#.", ".#............#.",
    "..#..........#..", "...#..####..#...", "....#..##..#....", ".....#....#.....",
    ".....#....#.....", "....#......#....", "...#...##...#...", "..#...####...#..",
    ".#...######...#.", ".#..########..#.", "################", "################"],
  VERIFICANDO: [ // lupa
    "................", "....######......", "...#......#.....", "..#........#....",
    ".#..........#...", ".#..........#...", ".#..........#...", ".#..........#...",
    ".#..........#...", "..#........#....", "...#......###...", "....######.###..",
    "...........###..", "............###.", ".............###", "..............##"],
  ACIONANDO: [ // raio
    ".........####...", "........####....", ".......####.....", "......####......",
    ".....####.......", "....####........", "...##########...", "..##########....",
    "......####......", ".....####.......", "....####........", "...####.........",
    "..####..........", ".###............", "##..............", "#..............."],
  ENTREGANDO: [ // caixa sobre a esteira com seta
    "................", "....########....", "....#......#....", "....#.####.#....",
    "....#......#....", "....########....", "................", "########...#....",
    "############....", "########...#....", "................", "################",
    "#..............#", "#.##..##..##..##", "#..............#", "################"],
  ERRO: [ // triângulo com !
    ".......##.......", ".......##.......", "......####......", "......#..#......",
    ".....#.##.#.....", ".....#.##.#.....", "....#..##..#....", "....#..##..#....",
    "...#...##...#...", "...#...##...#...", "..#..........#..", "..#....##....#..",
    ".#.....##.....#.", ".#............#.", "################", "################"],
};

/**
 * Tela do display OLED 0,96" 128x64 (SSD1306) bicolor, como o firmware desenha:
 * linha 1 na faixa amarela (y 0–15), linha 2 em y 24–39 e, no rodapé (y 48–63), os 5 ícones
 * da FSM em glifos de 20 px (x = 2 + k·25), com o do estado atual invertido.
 * O canvas tem 128x64 pixels de verdade e é ampliado sem suavização (NearestFilter).
 */
export function oledTexture() {
  const W = 128;
  const H = 64;
  const { c, ctx } = canvas(W, H);
  // Canvas auxiliar 8x maior para rasterizar o texto e depois reduzir por cobertura (sem anti-alias).
  const E = 8;
  const aux = canvas(16 * 8 * E, 16 * E);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  const px = new Uint8Array(W * H);

  /** Rasteriza 16 colunas de texto (8 px cada, célula de 16 px de altura) a partir da linha y0. */
  const texto = (s: string, y0: number) => {
    const a = aux.ctx;
    a.clearRect(0, 0, aux.c.width, aux.c.height);
    a.fillStyle = "#fff";
    a.font = `bold ${13 * E}px Consolas, "Courier New", monospace`;
    a.textAlign = "center";
    a.textBaseline = "alphabetic";
    [...s.padEnd(16).slice(0, 16)].forEach((ch, i) => a.fillText(ch, (i * 8 + 4) * E, 12 * E));
    const dados = a.getImageData(0, 0, aux.c.width, aux.c.height).data;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 128; x++) {
        let soma = 0;
        for (let dy = 0; dy < E; dy++) {
          for (let dx = 0; dx < E; dx++) soma += dados[(((y * E + dy) * aux.c.width) + x * E + dx) * 4 + 3];
        }
        if (soma / (E * E * 255) > 0.38) px[(y0 + y) * W + x] = 1;
      }
    }
  };

  const escrever = (l1: string, l2: string, estado: EstadoOled) => {
    px.fill(0);
    texto(l1, 0);
    texto(l2, 24);
    ESTADOS_OLED.forEach((nome, k) => {
      const x0 = 2 + k * 25;
      const inv = nome === estado;
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 20; x++) {
          const aceso = x >= 2 && x < 18 && ICONES[nome][y][x - 2] === "#";
          px[(48 + y) * W + x0 + x] = aceso !== inv ? 1 : 0;
        }
      }
    });
    // Bicolor: os 16 px de cima acendem em amarelo, o resto em azul-ciano.
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const y = Math.floor(i / W);
      const cor = px[i] ? (y < 16 ? [255, 214, 64] : [90, 196, 255]) : [4, 5, 8];
      img.data.set([cor[0], cor[1], cor[2], 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
    tex.needsUpdate = true;
  };
  escrever("Estoque:", "A:15 B:15 C:15", "AGUARDANDO");
  return { tex, escrever };
}

/** Sopro macio para as partículas de vapor. */
export function steamTexture() {
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.4, "rgba(240,230,255,0.35)");
  g.addColorStop(1, "rgba(240,230,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  // Rasga a borda com ruído para não parecer um disco perfeito.
  const img = ctx.getImageData(0, 0, 128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i + 3] *= 0.75 + Math.random() * 0.25;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Serigrafia de placa (PCB): trilhas finas sobre a cor da placa. */
export function pcbTexture(base: string, trilha: string) {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = trilha;
  ctx.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      if (Math.random() > 0.5) x += (Math.random() - 0.5) * 120;
      else y += (Math.random() - 0.5) * 120;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(230, 200, 120, 0.8)";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
