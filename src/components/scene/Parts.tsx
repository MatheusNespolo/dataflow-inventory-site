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
    const base = new THREE.MeshPhysicalMaterial({
      color: "#0d0913",
      roughness: 0.38,
      metalness: 0.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.25,
    });
    return {
      aluminio, aluminioEscovado, anodizado, borracha, plasticoPreto, ouro, cobreMotor,
      caixaReducao, pcbAzul, pcbPreta, pcbRoxa, pcbSensor, base,
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

/** Módulo LCD 16x2 com I²C, inclinado num suporte. */
export function Lcd({ m, tela, ...props }: { m: Materiais; tela: THREE.Texture } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.17, -0.06]} rotation-x={-0.35} material={m.aluminioEscovado} castShadow>
        <boxGeometry args={[0.7, 0.34, 0.03]} />
      </mesh>
      <group position={[0, 0.24, 0]} rotation-x={-0.35}>
        <mesh material={m.pcbAzul} castShadow>
          <boxGeometry args={[0.8, 0.36, 0.016]} />
        </mesh>
        <RoundedBox args={[0.72, 0.25, 0.04]} radius={0.01} position={[0, 0, 0.025]} material={m.plasticoPreto} castShadow />
        <mesh position={[0, 0, 0.047]}>
          <planeGeometry args={[0.64, 0.19]} />
          <meshStandardMaterial map={tela} emissiveMap={tela} emissive="#ffffff" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
