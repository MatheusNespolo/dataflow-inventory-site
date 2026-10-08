"use client";
// A bancada completa: base, 4 esteiras, sensores, eletrônica, fiação e as peças em movimento.
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BASE, ELETRONICA, PECA, PRINCIPAL, SECUNDARIA, Z_TOPO, trajetoPeca,
} from "./layout";
import {
  ArduinoUno, Esp32, Esteira, FonteAlimentacao, Irf520, Lcd, Motor, Portico, Sensor, useMateriais,
} from "./Parts";
import { sceneState } from "./sceneState";
import { beltTexture, lcdTexture } from "./textures";

const PECAS = ["A", "B", "C"] as const;
const COR_PECA = ["#c58cff", "#8b3dff", "#e879f9"];
const CICLO = 7.5; // segundos por entrega no modo automático
const VEL_LONA = 0.55; // unidades/s

/** Fios: curvas suaves rentes à base, do Arduino até cada ponto. */
function Fio({ pontos, cor }: { pontos: [number, number, number][]; cor: string }) {
  const geo = useMemo(() => {
    const curva = new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curva, 64, 0.013, 8, false);
  }, [pontos]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={cor} roughness={0.55} />
    </mesh>
  );
}

export function Bench() {
  const m = useMateriais();

  // Uma lona por esteira (offsets independentes).
  const lonas = useMemo(() => {
    const principal = beltTexture();
    principal.repeat.set(PRINCIPAL.comprimento / 0.9, 1);
    const sec = SECUNDARIA.x.map(() => {
      const t = beltTexture();
      t.repeat.set(SECUNDARIA.comprimento / 0.9, 1);
      return t;
    });
    return { principal, sec };
  }, []);
  const lcd = useMemo(() => lcdTexture(), []);

  const pecas = useRef<(THREE.Group | null)[]>([]);
  const ledTopo = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const ledJuncao = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const ledEsp = useRef<THREE.MeshStandardMaterial>(null);
  const luzJuncao = useRef<THREE.PointLight>(null);
  const textoLcd = useRef("");
  const tempo = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (!sceneState.reducedMotion) tempo.current += d;
    const t = tempo.current;

    // Qual esteira entrega e em que ponto do trajeto está a peça.
    let ativa = Math.floor(t / CICLO) % 3;
    let u = THREE.MathUtils.clamp(((t % CICLO) / CICLO - 0.12) / 0.85, 0, 1);
    if (sceneState.storyMix > 0.5) {
      // Na história, o pedido é sempre da peça B e o trajeto segue a rolagem (capítulos 05 e 06).
      ativa = 1;
      // Para em 0,85 do trajeto: a peça termina o capítulo 06 visível sobre a esteira principal.
      u = THREE.MathUtils.clamp((sceneState.story - 4) / 2, 0, 1) * 0.85;
    }

    // Lonas: a principal liga direto na fonte e nunca para; a secundária só anda na entrega.
    if (!sceneState.reducedMotion) lonas.principal.offset.x -= (VEL_LONA * d) / 0.9;
    lonas.sec.forEach((tex, i) => {
      const andando = i === ativa && u > 0 && u < 0.55;
      if (andando && !sceneState.reducedMotion) tex.offset.x -= (VEL_LONA * 1.4 * d) / 0.9;
    });

    let naJuncao = false;
    pecas.current.forEach((g, i) => {
      if (!g) return;
      if (i === ativa) {
        trajetoPeca(i, u, pos);
        g.position.copy(pos);
        // Reaparece no topo (reposição do estoque) com uma escala suave.
        const s = u >= 0.995 ? 0 : 1;
        g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, 0.25));
        g.rotation.y = u > 0.6 ? (u - 0.6) * 0.6 : 0;
        if (pos.z > SECUNDARIA.zFim - 0.35 && pos.z < PRINCIPAL.z - 0.1) naJuncao = true;
      } else {
        g.position.set(SECUNDARIA.x[i], SECUNDARIA.topo + PECA / 2, Z_TOPO);
        g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 1, 0.1));
        g.rotation.y = 0;
      }
      const lt = ledTopo.current[i];
      if (lt) lt.emissiveIntensity = i === ativa && u > 0.04 ? 0 : 4;
      const lj = ledJuncao.current[i];
      if (lj) lj.emissiveIntensity = THREE.MathUtils.lerp(lj.emissiveIntensity, i === ativa && naJuncao ? 6 : 0, 0.3);
    });

    if (luzJuncao.current) {
      luzJuncao.current.position.set(SECUNDARIA.x[ativa], 1.25, SECUNDARIA.zFim);
      luzJuncao.current.intensity = THREE.MathUtils.lerp(luzJuncao.current.intensity, naJuncao ? 6 : 0, 0.15);
    }
    if (ledEsp.current) {
      const pisca = u > 0 && u < 0.08 ? (Math.sin(t * 40) > 0 ? 5 : 0.3) : 0.6;
      ledEsp.current.emissiveIntensity = pisca;
    }

    // LCD acompanha a FSM.
    const linha2 = u <= 0 ? "AGUARDANDO" : u < 0.04 ? "VERIFICANDO" : u < 0.6 ? `ENTREGANDO ${PECAS[ativa]}` : `ENTREGUE ${PECAS[ativa]}`;
    if (linha2 !== textoLcd.current) {
      textoLcd.current = linha2;
      lcd.escrever("DATA FLOW INV.", linha2);
    }
  });

  const xDriver = (i: number) => SECUNDARIA.x[i] + 0.62;
  const zMotorSec = SECUNDARIA.zInicio - 0.18;
  const ard = ELETRONICA.arduino;

  return (
    <group position={[0, BASE.h / 2, 0]}>
      {/* Base com borda de LED */}
      <RoundedBox args={[BASE.w, BASE.h, BASE.d]} radius={0.05} smoothness={4} position={[0, -BASE.h / 2, 0]} material={m.base} receiveShadow castShadow />
      <mesh position={[0, -BASE.h / 2, BASE.d / 2 + 0.004]}>
        <boxGeometry args={[BASE.w - 0.3, 0.025, 0.01]} />
        <meshStandardMaterial color="#000" emissive="#8b3dff" emissiveIntensity={4} toneMapped={false} />
      </mesh>

      {/* Esteira principal + motor (sempre ligado) */}
      <Esteira comprimento={PRINCIPAL.comprimento} largura={PRINCIPAL.largura} topo={PRINCIPAL.topo} lona={lonas.principal} m={m} position={[0, 0, PRINCIPAL.z]} />
      <Motor m={m} position={[PRINCIPAL.comprimento / 2, PRINCIPAL.topo - 0.09, PRINCIPAL.z + PRINCIPAL.largura / 2 + 0.33]} rotation-y={Math.PI} />

      {/* Esteiras secundárias A, B e C */}
      {SECUNDARIA.x.map((x, i) => (
        <group key={x}>
          <Esteira
            comprimento={SECUNDARIA.comprimento}
            largura={SECUNDARIA.largura}
            topo={SECUNDARIA.topo}
            lona={lonas.sec[i]}
            m={m}
            position={[x, 0, (SECUNDARIA.zInicio + SECUNDARIA.zFim) / 2]}
            rotation-y={-Math.PI / 2}
          />
          <Motor m={m} position={[x + SECUNDARIA.largura / 2 + 0.33, SECUNDARIA.topo - 0.09, SECUNDARIA.zInicio]} rotation-y={-Math.PI / 2} />
          {/* Sensor de topo, sobre a peça em espera */}
          <Portico altura={SECUNDARIA.topo + 0.42} vao={SECUNDARIA.largura + 0.24} m={m} position={[x, 0, Z_TOPO]} />
          <Sensor
            m={m}
            ref={(el) => { ledTopo.current[i] = el; }}
            position={[x, SECUNDARIA.topo + 0.38, Z_TOPO]}
            rotation-y={Math.PI / 2}
          />
          {/* Sensor de junção, na saída da secundária */}
          <Portico altura={SECUNDARIA.topo + 0.42} vao={SECUNDARIA.largura + 0.24} m={m} position={[x, 0, SECUNDARIA.zFim - 0.2]} />
          <Sensor
            m={m}
            ref={(el) => { ledJuncao.current[i] = el; }}
            position={[x, SECUNDARIA.topo + 0.38, SECUNDARIA.zFim - 0.2]}
            rotation-y={Math.PI / 2}
          />
          {/* Driver IRF520 ao lado do motor */}
          <Irf520 m={m} position={[xDriver(i), 0, zMotorSec - 0.45]} />
          {/* Peça (cubo de acrílico) */}
          <group ref={(el) => { pecas.current[i] = el; }}>
            <RoundedBox args={[PECA, PECA, PECA]} radius={0.035} smoothness={4} castShadow>
              <meshPhysicalMaterial
                color={COR_PECA[i]}
                roughness={0.18}
                metalness={0.05}
                clearcoat={1}
                clearcoatRoughness={0.1}
                emissive={COR_PECA[i]}
                emissiveIntensity={0.18}
              />
            </RoundedBox>
          </group>
        </group>
      ))}

      {/* Eletrônica na faixa da frente */}
      <ArduinoUno m={m} position={[ard.x, ard.y, ard.z]} rotation-y={0.08} />
      <Lcd m={m} tela={lcd.tex} position={[ELETRONICA.lcd.x, 0, ELETRONICA.lcd.z]} />
      <Esp32 m={m} ref={ledEsp} position={[ELETRONICA.esp32.x, 0, ELETRONICA.esp32.z]} rotation-y={Math.PI / 2} />
      <FonteAlimentacao m={m} position={[ELETRONICA.fonte.x, 0, ELETRONICA.fonte.z]} />

      {/* Fiação */}
      <Fio cor="#e7e2f0" pontos={[[ard.x + 0.3, 0.12, ard.z], [-1.9, 0.03, 2.75], [-0.6, 0.03, 2.55], [ELETRONICA.esp32.x - 0.1, 0.1, ELETRONICA.esp32.z]]} />
      <Fio cor="#8b3dff" pontos={[[ard.x + 0.3, 0.12, ard.z - 0.1], [-2.1, 0.03, 2.5], [-1.5, 0.03, 2.75], [ELETRONICA.lcd.x - 0.2, 0.15, ELETRONICA.lcd.z - 0.1]]} />
      {SECUNDARIA.x.map((x, i) => (
        <Fio
          key={x}
          cor={["#c22b4a", "#151318", "#d9b35b"][i]}
          pontos={[[ard.x, 0.12, ard.z - 0.25], [ard.x + 0.4 + i * 0.1, 0.03, 2.3], [x + 0.75, 0.03, 0.4], [x + 0.75, 0.03, -2.2], [xDriver(i) - 0.1, 0.06, zMotorSec - 0.4]]}
        />
      ))}
      <Fio cor="#c22b4a" pontos={[[ELETRONICA.fonte.x - 0.4, 0.1, ELETRONICA.fonte.z - 0.3], [3.1, 0.03, 2.2], [3.95, 0.03, 1.4], [3.95, 0.03, -2.4], [xDriver(2) + 0.1, 0.06, zMotorSec - 0.4]]} />

      {/* Luz que pulsa quando a peça cruza a junção */}
      <pointLight ref={luzJuncao} color="#d946ef" intensity={0} distance={3} decay={2} />
    </group>
  );
}
