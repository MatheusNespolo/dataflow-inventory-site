"use client";
// Peças da bancada, modeladas com primitivas e materiais PBR.
import { RoundedBox } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { pcbTexture } from "./textures";

// ------------------------------------------------------------
// Materiais compartilhados
// ------------------------------------------------------------
export function useMateriais() {
  return useMemo(() => {
    const aluminio = new THREE.MeshStandardMaterial({ color: "#c9c3d6", metalness: 1, roughness: 0.28 });
    const aluminioEscovado = new THREE.MeshStandardMaterial({ color: "#8f879e", metalness: 1, roughness: 0.42 });
    const anodizado = new THREE.MeshStandardMaterial({ color: "#3a1677", metalness: 0.85, roughness: 0.3 });
    const borracha = new THREE.MeshStandardMaterial({ color: "#0e0c11", roughness: 0.9 });
    const plasticoPreto = new THREE.MeshStandardMaterial({ color: "#0b0a0d", roughness: 0.45, metalness: 0.1 });
    const ouro = new THREE.MeshStandardMaterial({ color: "#d9b35b", metalness: 1, roughness: 0.25 });
    const cobreMotor = new THREE.MeshStandardMaterial({ color: "#b8b2c4", metalness: 1, roughness: 0.18 });
    const caixaReducao = new THREE.MeshStandardMaterial({ color: "#d6a21e", roughness: 0.4, metalness: 0.05 });
    const pcbAzul = new THREE.MeshStandardMaterial({ map: pcbTexture("#0b5f86", "#1478a8"), roughness: 0.5, metalness: 0.1 });
    const pcbPreta = new THREE.MeshStandardMaterial({ map: pcbTexture("#121016", "#24202c"), roughness: 0.45, metalness: 0.1 });
    const pcbRoxa = new THREE.MeshStandardMaterial({ map: pcbTexture("#3b1a6e", "#5428a0"), roughness: 0.5, metalness: 0.1 });
    const pcbSensor = new THREE.MeshStandardMaterial({ map: pcbTexture("#1c2f7a", "#2b44a8"), roughness: 0.5, metalness: 0.1 });
    const pcbVerde = new THREE.MeshStandardMaterial({ map: pcbTexture("#1d6b3c", "#2a8a50"), roughness: 0.5, metalness: 0.1 });
    // Plástico impresso em 3D (PLA fosco) da roda separadora.
    const pla = new THREE.MeshStandardMaterial({ color: "#d8d2e6", roughness: 0.62, metalness: 0.02 });
    const base = new THREE.MeshPhysicalMaterial({
      color: "#0d0913",
      roughness: 0.38,
      metalness: 0.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.25,
    });
    return {
      aluminio, aluminioEscovado, anodizado, borracha, plasticoPreto, ouro, cobreMotor,
      caixaReducao, pcbAzul, pcbPreta, pcbRoxa, pcbSensor, pcbVerde, pla, base,
    };
  }, []);
}
export type Materiais = ReturnType<typeof useMateriais>;

// ------------------------------------------------------------
// Esteira (eixo local +X; topo da lona em y = topo)
// ------------------------------------------------------------
type EsteiraProps = {
  comprimento: number;
  largura: number;
  topo: number;
  lona: THREE.Texture;
  m: Materiais;
} & ThreeElements["group"];

export function Esteira({ comprimento: L, largura: W, topo, lona, m, ...props }: EsteiraProps) {
  const lonaMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: lona, roughness: 0.82, metalness: 0.05, color: "#ffffff" }),
    [lona],
  );
  const pernas = [-L / 2 + 0.25, L / 2 - 0.25];
  const lados = [-1, 1];
  const r = 0.085;
  return (
    <group {...props}>
      {/* Lona (topo) e espessura */}
      <mesh position={[0, topo, 0]} rotation-x={-Math.PI / 2} receiveShadow material={lonaMat}>
        <planeGeometry args={[L, W]} />
      </mesh>
      <mesh position={[0, topo - 0.03, 0]} material={m.borracha} castShadow>
        <boxGeometry args={[L, 0.05, W]} />
      </mesh>
      {/* Roletes das pontas */}
      {[-L / 2, L / 2].map((x) => (
        <mesh key={x} position={[x, topo - r, 0]} rotation-x={Math.PI / 2} material={m.borracha} castShadow>
          <cylinderGeometry args={[r, r, W, 28]} />
        </mesh>
      ))}
      {/* Perfis laterais de alumínio + guias anodizadas */}
      {lados.map((s) => (
        <group key={s} position={[0, 0, s * (W / 2 + 0.045)]}>
          <RoundedBox args={[L + 0.12, 0.2, 0.06]} radius={0.02} smoothness={3} position={[0, topo - 0.1, 0]} material={m.aluminio} castShadow receiveShadow />
          <RoundedBox args={[L, 0.05, 0.03]} radius={0.012} smoothness={2} position={[0, topo + 0.06, -s * 0.012]} material={m.anodizado} castShadow />
          {/* Parafusos do perfil */}
          {Array.from({ length: Math.floor(L / 0.6) }, (_, k) => -L / 2 + 0.3 + k * 0.6).map((x) => (
            <mesh key={x} position={[x, topo - 0.1, s * 0.032]} rotation-x={Math.PI / 2} material={m.cobreMotor}>
              <cylinderGeometry args={[0.018, 0.018, 0.012, 12]} />
            </mesh>
          ))}
          {/* Pernas */}
          {pernas.map((x) => (
            <mesh key={x} position={[x, (topo - 0.2) / 2, 0]} material={m.aluminioEscovado} castShadow>
              <boxGeometry args={[0.06, topo - 0.2, 0.06]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------
// Motor DC com caixa de redução (eixo ao longo de Z local)
// ------------------------------------------------------------
export function Motor({ m, ...props }: { m: Materiais } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh rotation-x={Math.PI / 2} material={m.cobreMotor} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.3, 32]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, -0.17]} material={m.plasticoPreto} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 0.05, 32]} />
      </mesh>
      <RoundedBox args={[0.24, 0.24, 0.2]} radius={0.025} position={[0, 0, 0.25]} material={m.caixaReducao} castShadow />
      <mesh rotation-x={Math.PI / 2} position={[0, 0.05, 0.4]} material={m.aluminio}>
        <cylinderGeometry args={[0.022, 0.022, 0.12, 16]} />
      </mesh>
      {/* Terminais e fios */}
      {[-0.04, 0.04].map((x, k) => (
        <mesh key={x} position={[x, 0.02, -0.21]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
          <meshStandardMaterial color={k ? "#d22" : "#111"} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------
// Sensor infravermelho TCRT5000 (placa + emissor/receptor + LED indicador)
// ------------------------------------------------------------
export const Sensor = forwardRef<THREE.MeshStandardMaterial, { m: Materiais } & ThreeElements["group"]>(
  function Sensor({ m, ...props }, ledRef) {
    return (
      <group {...props}>
        <mesh material={m.pcbSensor} castShadow>
          <boxGeometry args={[0.14, 0.012, 0.32]} />
        </mesh>
        {/* Emissor (azulado) e receptor (preto) apontando para baixo */}
        <mesh position={[-0.03, -0.035, -0.12]} material={m.plasticoPreto}>
          <cylinderGeometry args={[0.022, 0.022, 0.06, 16]} />
        </mesh>
        <mesh position={[0.03, -0.035, -0.12]}>
          <cylinderGeometry args={[0.022, 0.022, 0.06, 16]} />
          <meshPhysicalMaterial color="#6f7fd8" roughness={0.1} transmission={0.4} thickness={0.05} />
        </mesh>
        {/* Potenciômetro de ajuste */}
        <mesh position={[0, 0.03, 0.05]}>
          <boxGeometry args={[0.07, 0.05, 0.07]} />
          <meshStandardMaterial color="#2546c8" roughness={0.4} />
        </mesh>
        {/* LED indicador — o Bench acende quando há peça */}
        <mesh position={[0.04, 0.012, 0.12]}>
          <boxGeometry args={[0.025, 0.012, 0.018]} />
          <meshStandardMaterial ref={ledRef} color="#2a0a10" emissive="#ff2e88" emissiveIntensity={0} toneMapped={false} />
        </mesh>
      </group>
    );
  },
);

/** Pórtico de alumínio que segura o sensor sobre a esteira. */
export function Portico({ altura, vao, m, ...props }: { altura: number; vao: number; m: Materiais } & ThreeElements["group"]) {
  return (
    <group {...props}>
      {[-vao / 2, vao / 2].map((x) => (
        <mesh key={x} position={[x, altura / 2, 0]} material={m.aluminioEscovado} castShadow>
          <boxGeometry args={[0.05, altura, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0, altura, 0]} material={m.aluminio} castShadow>
        <boxGeometry args={[vao + 0.05, 0.05, 0.08]} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------
// Placas
// ------------------------------------------------------------
function Barra({ comprimento, ...props }: { comprimento: number } & ThreeElements["mesh"]) {
  return (
    <mesh {...props}>
      <boxGeometry args={[comprimento, 0.08, 0.025]} />
      <meshStandardMaterial color="#09080b" roughness={0.5} />
    </mesh>
  );
}

export function ArduinoUno({ m, ...props }: { m: Materiais } & ThreeElements["group"]) {
  return (
    <group {...props}>
      {/* Espaçadores */}
      {[[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.03, z]} material={m.ouro}>
          <cylinderGeometry args={[0.018, 0.018, 0.06, 10]} />
        </mesh>
      ))}
      <group position={[0, 0.07, 0]}>
        <mesh material={m.pcbAzul} castShadow receiveShadow>
          <boxGeometry args={[0.69, 0.016, 0.53]} />
        </mesh>
        {/* ATmega328P (DIP-28) */}
        <mesh position={[0.08, 0.03, 0.12]} material={m.plasticoPreto} castShadow>
          <boxGeometry args={[0.36, 0.04, 0.08]} />
        </mesh>
        {Array.from({ length: 14 }, (_, k) => -0.165 + k * 0.0254).map((x) =>
          [-1, 1].map((s) => (
            <mesh key={`${x}${s}`} position={[0.08 + x, 0.012, 0.12 + s * 0.045]} material={m.aluminio}>
              <boxGeometry args={[0.008, 0.02, 0.012]} />
            </mesh>
          )),
        )}
        {/* Barras de pinos fêmea */}
        <Barra comprimento={0.42} position={[0.08, 0.048, -0.24]} />
        <Barra comprimento={0.36} position={[0.12, 0.048, 0.24]} />
        {/* USB-B e conector P4 */}
        <mesh position={[-0.33, 0.06, -0.12]} material={m.aluminio} castShadow>
          <boxGeometry args={[0.16, 0.11, 0.12]} />
        </mesh>
        <mesh position={[-0.33, 0.055, 0.17]} material={m.plasticoPreto} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.09]} />
        </mesh>
        {/* Regulador, cristal e LEDs */}
        <mesh position={[-0.12, 0.02, -0.05]} material={m.plasticoPreto}>
          <boxGeometry args={[0.07, 0.025, 0.07]} />
        </mesh>
        <mesh position={[-0.05, 0.02, 0.16]} material={m.aluminio}>
          <boxGeometry args={[0.07, 0.02, 0.03]} />
        </mesh>
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[-0.02 + k * 0.03, 0.014, -0.13]}>
            <boxGeometry args={[0.014, 0.01, 0.009]} />
            <meshStandardMaterial color="#fff" emissive={k === 0 ? "#47ff9c" : "#ffb347"} emissiveIntensity={k === 0 ? 3 : 0.4} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export const Esp32 = forwardRef<THREE.MeshStandardMaterial, { m: Materiais } & ThreeElements["group"]>(
  function Esp32({ m, ...props }, ledRef) {
    return (
      <group {...props}>
        {/* Barras de pinos (macho) apoiam a placa */}
        {[-0.125, 0.125].map((x) => (
          <mesh key={x} position={[x, 0.04, 0]} material={m.plasticoPreto}>
            <boxGeometry args={[0.025, 0.06, 0.48]} />
          </mesh>
        ))}
        <group position={[0, 0.08, 0]}>
          <mesh material={m.pcbPreta} castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.016, 0.52]} />
          </mesh>
          {/* Blindagem do módulo WROOM e antena em PCB */}
          <RoundedBox args={[0.18, 0.03, 0.25]} radius={0.006} position={[0, 0.022, -0.06]} material={m.aluminio} castShadow />
          <mesh position={[0, 0.01, -0.22]}>
            <boxGeometry args={[0.18, 0.006, 0.07]} />
            <meshStandardMaterial color="#1a1324" roughness={0.6} />
          </mesh>
          {/* micro-USB */}
          <mesh position={[0, 0.02, 0.25]} material={m.aluminio}>
            <boxGeometry args={[0.08, 0.03, 0.05]} />
          </mesh>
          {/* LED de status — pisca quando chega comando */}
          <mesh position={[0.08, 0.012, 0.17]}>
            <boxGeometry args={[0.016, 0.01, 0.012]} />
            <meshStandardMaterial ref={ledRef} color="#110a22" emissive="#9b5cff" emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
        </group>
      </group>
    );
  },
);

export function Irf520({ m, ...props }: { m: Materiais } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.03, 0]} material={m.pcbRoxa} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.016, 0.22]} />
      </mesh>
      {/* MOSFET TO-220 com aba de alumínio */}
      <mesh position={[0.06, 0.12, -0.06]} material={m.plasticoPreto} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.04]} />
      </mesh>
      <mesh position={[0.06, 0.2, -0.08]} material={m.aluminio}>
        <boxGeometry args={[0.1, 0.1, 0.012]} />
      </mesh>
      {/* Bornes */}
      {[-0.1, 0.0].map((x) => (
        <mesh key={x} position={[x, 0.07, 0.07]} castShadow>
          <boxGeometry args={[0.09, 0.07, 0.07]} />
          <meshStandardMaterial color="#2156c9" roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

export function FonteAlimentacao({ m, ...props }: { m: Materiais } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <RoundedBox args={[1.1, 0.32, 0.6]} radius={0.03} position={[0, 0.16, 0]} material={m.aluminioEscovado} castShadow receiveShadow />
      {/* Grade de ventilação */}
      {Array.from({ length: 9 }, (_, k) => -0.4 + k * 0.1).map((x) => (
        <mesh key={x} position={[x, 0.321, 0]} material={m.plasticoPreto}>
          <boxGeometry args={[0.04, 0.004, 0.42]} />
        </mesh>
      ))}
      {/* Borneira e LED de "ligada" */}
      <mesh position={[0, 0.1, 0.31]} material={m.plasticoPreto}>
        <boxGeometry args={[0.9, 0.12, 0.04]} />
      </mesh>
      <mesh position={[0.48, 0.24, 0.302]}>
        <boxGeometry args={[0.03, 0.03, 0.01]} />
        <meshStandardMaterial color="#fff" emissive="#47ff9c" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Módulo OLED 0,96" 128x64 I²C (SSD1306): placa quase quadrada (~27 mm), vidro preto com a área
 * ativa de ~22x11 mm (2:1) e 4 pinos (GND, VCC, SCL, SDA) no topo. Fica num suporte inclinado.
 * Levemente ampliado (1,25x) para a tela continuar legível nos enquadramentos da câmera.
 */
export function Oled({ m, tela, ...props }: { m: Materiais; tela: THREE.Texture } & ThreeElements["group"]) {
  return (
    <group {...props}>
      {/* Suporte de alumínio dobrado */}
      <mesh position={[0, 0.005, -0.1]} material={m.aluminioEscovado} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.01, 0.2]} />
      </mesh>
      <mesh position={[0, 0.13, -0.075]} rotation-x={-0.35} material={m.aluminioEscovado} castShadow>
        <boxGeometry args={[0.28, 0.26, 0.012]} />
      </mesh>
      <group position={[0, 0.22, -0.04]} rotation-x={-0.35} scale={1.25}>
        {/* Placa */}
        <mesh material={m.pcbAzul} castShadow>
          <boxGeometry args={[0.273, 0.278, 0.012]} />
        </mesh>
        {/* Furos de fixação nos cantos */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => (
          <mesh key={`${x}${y}`} position={[x * 0.115, y * 0.118, 0.0065]} rotation-x={Math.PI / 2} material={m.ouro}>
            <cylinderGeometry args={[0.014, 0.014, 0.002, 14]} />
          </mesh>
        ))}
        {/* Barra de 4 pinos no topo (GND, VCC, SCL, SDA), saindo por trás */}
        <mesh position={[0, 0.118, -0.02]} material={m.plasticoPreto}>
          <boxGeometry args={[0.1, 0.025, 0.025]} />
        </mesh>
        {[-1.5, -0.5, 0.5, 1.5].map((k) => (
          <mesh key={k} position={[k * 0.0254, 0.118, -0.04]} rotation-x={Math.PI / 2} material={m.ouro}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.07, 6]} />
          </mesh>
        ))}
        {/* Vidro do painel e cabo flexível dobrado na borda de baixo */}
        <mesh position={[0, -0.018, 0.009]} material={m.plasticoPreto}>
          <boxGeometry args={[0.267, 0.193, 0.007]} />
        </mesh>
        <mesh position={[0, -0.122, 0.004]}>
          <boxGeometry args={[0.12, 0.018, 0.004]} />
          <meshStandardMaterial color="#b8862b" roughness={0.5} />
        </mesh>
        {/* Área ativa 128x64 (21,7 x 10,9 mm) */}
        <mesh position={[0, -0.004, 0.0131]}>
          <planeGeometry args={[0.217, 0.109]} />
          <meshStandardMaterial color="#000" map={tela} emissiveMap={tela} emissive="#ffffff" emissiveIntensity={1.25} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// ------------------------------------------------------------
// Roda separadora + motor de passo 28BYJ-48 + driver ULN2003
// ------------------------------------------------------------
type RodaProps = {
  m: Materiais;
  raio: number;
  /** Altura do topo do piso (fundo dos compartimentos) e da borda das paredes. */
  fundo: number;
  borda: number;
  /** Cor de cada compartimento (A, B, C) e o ângulo de parada (rad) que o põe de frente para a esteira. */
  cores: readonly string[];
  angulos: readonly number[];
} & ThreeElements["group"];

/**
 * Roda impressa em 3D, eixo vertical: piso, parede externa e 3 divisórias a 120°.
 * Com o rotor girado no ângulo de parada de um compartimento, ele fica voltado para -X (a esteira).
 */
export const RodaSeparadora = forwardRef<THREE.Group, RodaProps>(function RodaSeparadora(
  { m, raio: R, fundo, borda, cores, angulos, ...props },
  rotor,
) {
  const piso = 0.035;
  const alt = borda - fundo;
  const parede = useMemo(() => {
    // Parede externa: anel extrudado (cilindro oco), com a base em y = 0.
    const forma = new THREE.Shape().absarc(0, 0, R, 0, Math.PI * 2, false);
    forma.holes.push(new THREE.Path().absarc(0, 0, R - 0.025, 0, Math.PI * 2, true));
    const g = new THREE.ExtrudeGeometry(forma, { depth: alt, bevelEnabled: false, curveSegments: 64 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [R, alt]);
  // Setor de 120° centrado em -X (ângulo π no plano do círculo), com folga para as divisórias.
  const setor = (folga: number) => [Math.PI - Math.PI / 3 + folga, (2 * Math.PI) / 3 - 2 * folga] as const;
  return (
    <group {...props}>
      <group ref={rotor}>
        {/* Piso */}
        <mesh position={[0, fundo - piso / 2, 0]} material={m.pla} castShadow receiveShadow>
          <cylinderGeometry args={[R, R, piso, 64]} />
        </mesh>
        <mesh position={[0, fundo, 0]} geometry={parede} material={m.pla} castShadow receiveShadow />
        {/* Cubo central */}
        <mesh position={[0, fundo + alt / 2, 0]} material={m.pla} castShadow>
          <cylinderGeometry args={[0.06, 0.07, alt, 24]} />
        </mesh>
        {/* Divisórias nas fronteiras entre os compartimentos (a 60° do centro de cada um) */}
        {[0, 1, 2].map((k) => (
          <group key={k} rotation-y={(k * 2 * Math.PI) / 3}>
            <mesh position={[R / 2, fundo + alt / 2, 0]} material={m.pla} castShadow>
              <boxGeometry args={[R - 0.02, alt, 0.025]} />
            </mesh>
          </group>
        ))}
        {/* Compartimentos: fundo e faixa da borda na cor da peça */}
        {cores.map((cor, k) => (
          <group key={cor} rotation-y={-angulos[k]}>
            <mesh position={[0, fundo + 0.002, 0]} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[R - 0.03, 32, ...setor(0.03)]} />
              <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.25} roughness={0.55} />
            </mesh>
            <mesh position={[0, borda + 0.003, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[R - 0.025, R, 32, 1, ...setor(0.05)]} />
              <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={1.2} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
});

/** Motor de passo 28BYJ-48 (lata de ~28 mm com abas de fixação), eixo para cima. */
export function MotorPasso({ m, ...props }: { m: Materiais } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.095, 0]} material={m.cobreMotor} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.19, 36]} />
      </mesh>
      {/* Abas de fixação com parafusos */}
      <mesh position={[0, 0.185, 0]} material={m.cobreMotor} castShadow>
        <boxGeometry args={[0.42, 0.01, 0.07]} />
      </mesh>
      {[-0.175, 0.175].map((x) => (
        <mesh key={x} position={[x, 0.195, 0]} material={m.plasticoPreto}>
          <cylinderGeometry args={[0.02, 0.02, 0.014, 12]} />
        </mesh>
      ))}
      {/* Tampa da redução e eixo (deslocado do centro, como no motor real) */}
      <mesh position={[0, 0.2, 0.04]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 20]} />
        <meshStandardMaterial color="#2a62c9" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.225, 0.04]} material={m.aluminio}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
      </mesh>
      {/* Caixa azul da saída dos fios, na lateral */}
      <mesh position={[0, 0.09, -0.15]} castShadow>
        <boxGeometry args={[0.15, 0.16, 0.05]} />
        <meshStandardMaterial color="#2a62c9" roughness={0.45} />
      </mesh>
    </group>
  );
}

/** Driver ULN2003 (placa ~35x32 mm, CI DIP-16, conector branco do motor e 4 LEDs das bobinas). */
export function Uln2003({
  m,
  leds,
  ...props
}: { m: Materiais; leds: React.RefObject<(THREE.MeshStandardMaterial | null)[]> } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.03, 0]} material={m.pcbVerde} castShadow receiveShadow>
        <boxGeometry args={[0.35, 0.016, 0.32]} />
      </mesh>
      {/* ULN2003 (DIP-16) */}
      <mesh position={[-0.06, 0.055, 0]} material={m.plasticoPreto} castShadow>
        <boxGeometry args={[0.07, 0.035, 0.2]} />
      </mesh>
      {/* Conector branco de 5 vias do motor */}
      <mesh position={[0.1, 0.07, -0.09]} castShadow>
        <boxGeometry args={[0.07, 0.07, 0.12]} />
        <meshStandardMaterial color="#efece4" roughness={0.5} />
      </mesh>
      {/* Pinos de entrada IN1–IN4 */}
      <mesh position={[-0.02, 0.05, 0.14]} material={m.plasticoPreto}>
        <boxGeometry args={[0.2, 0.025, 0.025]} />
      </mesh>
      {/* LEDs A–D: o Bench acende conforme o passo das bobinas */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[0.1, 0.044, 0.0 + k * 0.035]}>
          <boxGeometry args={[0.02, 0.012, 0.016]} />
          <meshStandardMaterial
            ref={(el) => {
              leds.current[k] = el;
            }}
            color="#2a0a10"
            emissive="#ff2e2e"
            emissiveIntensity={0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
