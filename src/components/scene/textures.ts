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

/** Visor do LCD 16x2 com a FSM (duas linhas). Retorna a textura e uma função para reescrever. */
export function lcdTexture() {
  const { c, ctx } = canvas(512, 160);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const escrever = (l1: string, l2: string) => {
    ctx.fillStyle = "#2a0b5c";
    ctx.fillRect(0, 0, 512, 160);
    // Grade de pixels do LCD.
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    for (let x = 0; x < 512; x += 32) ctx.fillRect(x, 0, 2, 160);
    ctx.font = "bold 44px monospace";
    ctx.fillStyle = "#e9dcff";
    ctx.shadowColor = "#b388ff";
    ctx.shadowBlur = 12;
    ctx.fillText(l1.padEnd(16).slice(0, 16), 24, 62);
    ctx.fillText(l2.padEnd(16).slice(0, 16), 24, 128);
    ctx.shadowBlur = 0;
    tex.needsUpdate = true;
  };
  escrever("DATA FLOW INV.", "AGUARDANDO");
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
