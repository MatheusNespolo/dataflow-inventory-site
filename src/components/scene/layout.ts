// Geometria da bancada (1 unidade ≈ 10 cm). Usada pelo modelo e pelos enquadramentos da câmera.
import * as THREE from "three";

export const BASE = { w: 9.4, d: 7, h: 0.14 };

/** Esteira principal: corre em X, liga direto na fonte (sempre em movimento). */
export const PRINCIPAL = { comprimento: 7.4, largura: 0.82, topo: 0.62, z: 1.55 };

/** Esteiras secundárias A, B e C: correm em +Z e despejam a peça na principal. */
export const SECUNDARIA = {
  comprimento: 3.6,
  largura: 0.7,
  topo: 0.9,
  zInicio: -2.75,
  zFim: 0.85,
  x: [-2.3, 0, 2.3] as const,
};

export const PECA = 0.3;

/** Onde cada componente eletrônico fica (faixa da frente da base). */
export const ELETRONICA = {
  arduino: new THREE.Vector3(-2.75, 0, 2.85),
  oled: new THREE.Vector3(-1.25, 0, 2.95),
  /** Placa ULN2003 do motor de passo da roda separadora. */
  uln2003: new THREE.Vector3(4.3, 0, 0.72),
  esp32: new THREE.Vector3(0.25, 0, 2.85),
  fonte: new THREE.Vector3(2.75, 0, 2.85),
};

export const Z_TOPO = SECUNDARIA.zInicio + 0.45;

/**
 * Roda separadora (impressa em 3D) no fim da esteira principal: tambor de eixo vertical com
 * 3 compartimentos abertos em cima. O compartimento voltado para a esteira (lado -X) recebe a peça.
 * Um motor de passo 28BYJ-48 embaixo gira a roda até o compartimento do pedido.
 */
export const SEPARADOR = {
  x: 4.2,
  z: PRINCIPAL.z,
  raio: 0.46,
  /** Altura do fundo dos compartimentos (topo do piso da roda). */
  fundo: 0.24,
  /** Altura da borda das paredes (abaixo dos roletes da esteira principal). */
  borda: 0.44,
  /** Ângulo de parada de cada compartimento (A, B, C), em graus; C também é a posição neutra. */
  angulos: [120, 240, 0] as const,
  /** Velocidade de giro (graus/s). */
  velocidade: 60,
};

/**
 * Posição da peça da esteira `i` no parâmetro de trajeto u ∈ [0, 1]:
 * 0 → no topo (sensor de topo) · 0,5 → saindo da secundária (junção) · 1 → fim da principal.
 */
export function trajetoPeca(i: number, u: number, out: THREE.Vector3) {
  const x0 = SECUNDARIA.x[i];
  const ySec = SECUNDARIA.topo + PECA / 2;
  const yPri = PRINCIPAL.topo + PECA / 2;
  if (u <= 0.5) {
    const k = u / 0.5;
    out.set(x0, ySec, THREE.MathUtils.lerp(Z_TOPO, SECUNDARIA.zFim + 0.1, k));
  } else if (u <= 0.6) {
    // Queda da secundária para a principal (parábola curta).
    const k = (u - 0.5) / 0.1;
    const z = THREE.MathUtils.lerp(SECUNDARIA.zFim + 0.1, PRINCIPAL.z, k);
    const y = THREE.MathUtils.lerp(ySec, yPri, k) + Math.sin(k * Math.PI) * 0.12;
    out.set(x0, y, z);
  } else {
    const k = (u - 0.6) / 0.4;
    // Termina no meio do compartimento voltado para a esteira.
    const xFim = SEPARADOR.x - SEPARADOR.raio * 0.5;
    const x = THREE.MathUtils.lerp(x0, xFim, k);
    // Depois da borda, a peça cai da esteira e para no fundo do compartimento da roda separadora.
    const passou = Math.max(0, x - PRINCIPAL.comprimento / 2);
    const yFundo = SEPARADOR.fundo + PECA / 2;
    out.set(x, Math.max(yFundo, yPri - passou * passou * 7), PRINCIPAL.z);
  }
  return out;
}

/**
 * Ângulo da roda (graus) `segundos` depois de começar a girar de `de` para `para`,
 * pelo caminho mais curto e a `SEPARADOR.velocidade`. Para no destino.
 */
export function anguloRoda(de: number, para: number, segundos: number) {
  const delta = THREE.MathUtils.euclideanModulo(para - de + 180, 360) - 180;
  const passo = Math.min(Math.abs(delta), Math.max(0, segundos) * SEPARADOR.velocidade);
  return de + Math.sign(delta) * passo;
}
