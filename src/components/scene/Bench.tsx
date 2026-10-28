"use client";
// A bancada completa: base, 4 esteiras, sensores, roda separadora, eletrônica, fiação e as peças em movimento.
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BASE, ELETRONICA, PECA, PRINCIPAL, SECUNDARIA, SEPARADOR, Z_TOPO, anguloRoda, trajetoPeca,
} from "./layout";
import {
  ArduinoUno, Esp32, Esteira, FonteAlimentacao, Irf520, Motor, MotorPasso, Oled, Portico, RodaSeparadora,
  Sensor, Uln2003, useMateriais,
} from "./Parts";
import { sceneState } from "./sceneState";
import { beltTexture, oledTexture, type EstadoOled } from "./textures";

const PECAS = ["A", "B", "C"] as const;
const COR_PECA = ["#c58cff", "#8b3dff", "#e879f9"];
const CICLO = 7.5; // segundos por entrega no modo automático
const VEL_LONA = 0.55; // unidades/s
/** Segundos de trajeto por unidade de u no modo automático (u percorre 85% do ciclo). */
const SEG_POR_U = CICLO * 0.85;
/** Fase em que o pedido é aprovado (fim da verificação): a roda separadora começa a girar. */
const U_APROVADO = 0.04;
const ANGULOS_RODA = SEPARADOR.angulos.map((g) => THREE.MathUtils.degToRad(g));

/** Fase em que a peça passa pela junção (fim do capítulo 05). */
const U_JUNCAO = 0.45;

/**
 * O que o OLED mostra em cada fase do trajeto: os mesmos textos do firmware
 * (src/logica/telas.cpp). Na verificação a tela de estoque continua; a de entrega
 * aparece quando o motor parte; depois da junção, "Saindo da esteira"; no fim, a
 * tela de entrega concluída com o sistema já de volta a aguardar.
 */
function telaOled(u: number, p: string): [string, string, EstadoOled] {
  if (u <= 0) return ["Estoque:", "A:15 B:15 C:15", "AGUARDANDO"];
  if (u < U_APROVADO) return ["Estoque:", "A:15 B:15 C:15", "VERIFICANDO"];
  if (u < 0.1) return [`Entregando ${p}`, "Aguarda juncao", "ACIONANDO"];
  if (u < U_JUNCAO) return [`Entregando ${p}`, "Aguarda juncao", "ENTREGANDO"];
  if (u < 0.6) return ["Saindo da", "esteira...", "ENTREGANDO"];
  return ["Entrega OK!", `Entregue! ${p}:`, "AGUARDANDO"];
}

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
  const oled = useMemo(() => oledTexture(), []);

  const pecas = useRef<(THREE.Group | null)[]>([]);
  const ledTopo = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const ledJuncao = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const ledEsp = useRef<THREE.MeshStandardMaterial>(null);
  const luzJuncao = useRef<THREE.PointLight>(null);
  const textoOled = useRef("");
  const roda = useRef<THREE.Group>(null);
  const ledsUln = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const tempo = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (!sceneState.reducedMotion) tempo.current += d;
    const t = tempo.current;

    // Qual esteira entrega e em que ponto do trajeto está a peça.
    let ativa = Math.floor(t / CICLO) % 3;
    let u = THREE.MathUtils.clamp(((t % CICLO) / CICLO - 0.12) / 0.85, 0, 1);
    const naHistoria = sceneState.storyMix > 0.5;
    if (naHistoria) {
      // Na história, o pedido é sempre da peça B e o trajeto segue a rolagem (capítulos 05 e 06):
      // o 05 leva a peça até a junção; o 06 a leva pela principal até o compartimento B da roda.
      ativa = 1;
      const st = sceneState.story - 4;
      u = st < 1 ? THREE.MathUtils.clamp(st, 0, 1) * U_JUNCAO : Math.min(1, U_JUNCAO + ((st - 1) / 0.85) * (1 - U_JUNCAO));
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
        // Reaparece no topo (reposição do estoque) com uma escala suave. Na história, fica na roda.
        const s = u >= 0.995 && !naHistoria ? 0 : 1;
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

    // Roda separadora: parte do compartimento anterior (na história, da posição neutra) assim que
    // o pedido é aprovado e gira pelo caminho mais curto até o da peça pedida, onde fica.
    const de = naHistoria ? SEPARADOR.angulos[2] : SEPARADOR.angulos[(ativa + 2) % 3];
    const para = SEPARADOR.angulos[ativa];
    const graus = anguloRoda(de, para, (u - U_APROVADO) * SEG_POR_U);
    if (roda.current) roda.current.rotation.y = THREE.MathUtils.degToRad(graus);
    // LEDs do ULN2003 seguem as bobinas enquanto o motor de passo gira.
    const girando = graus !== de && graus !== para;
    const passo = Math.floor(THREE.MathUtils.euclideanModulo(graus, 360) / 3) % 4;
    ledsUln.current.forEach((led, k) => {
      if (led) led.emissiveIntensity = girando && (k === passo || k === (passo + 1) % 4) ? 4 : 0;
    });

    // OLED acompanha a FSM (só redesenha quando o texto ou o estado mudam).
    const [l1, l2, estado] = telaOled(u, PECAS[ativa]);
    const chave = `${l1}|${l2}|${estado}`;
    if (chave !== textoOled.current) {
      textoOled.current = chave;
      oled.escrever(l1, l2, estado);
    }
  });

  const xDriver = (i: number) => SECUNDARIA.x[i] + 0.62;
  const zMotorSec = SECUNDARIA.zInicio - 0.18;
  const ard = ELETRONICA.arduino;
  const tela = ELETRONICA.oled;
  const uln = ELETRONICA.uln2003;

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

      {/* Roda separadora no fim da principal, com o motor de passo embaixo e o ULN2003 ao lado */}
      <RodaSeparadora
        ref={roda}
        m={m}
        raio={SEPARADOR.raio}
        fundo={SEPARADOR.fundo}
        borda={SEPARADOR.borda}
        cores={COR_PECA}
        angulos={ANGULOS_RODA}
        position={[SEPARADOR.x, 0, SEPARADOR.z]}
      />
      <MotorPasso m={m} position={[SEPARADOR.x, 0, SEPARADOR.z - 0.04]} />
      <Uln2003 m={m} leds={ledsUln} position={[uln.x, 0, uln.z]} />

      {/* Eletrônica na faixa da frente */}
      <ArduinoUno m={m} position={[ard.x, ard.y, ard.z]} rotation-y={0.08} />
      <Oled m={m} tela={oled.tex} position={[tela.x, 0, tela.z]} />
      <Esp32 m={m} ref={ledEsp} position={[ELETRONICA.esp32.x, 0, ELETRONICA.esp32.z]} rotation-y={Math.PI / 2} />
      <FonteAlimentacao m={m} position={[ELETRONICA.fonte.x, 0, ELETRONICA.fonte.z]} />

      {/* Fiação */}
      <Fio cor="#e7e2f0" pontos={[[ard.x + 0.3, 0.12, ard.z], [-1.9, 0.03, 2.75], [-0.6, 0.03, 2.55], [ELETRONICA.esp32.x - 0.1, 0.1, ELETRONICA.esp32.z]]} />
      {/* I²C do OLED: chega aos 4 pinos no topo da placa, por trás do suporte */}
      <Fio cor="#8b3dff" pontos={[[ard.x + 0.3, 0.12, ard.z - 0.1], [-2.1, 0.03, 2.5], [-1.5, 0.03, 2.6], [tela.x - 0.03, 0.1, tela.z - 0.34], [tela.x, 0.32, tela.z - 0.18]]} />
      {/* Arduino → ULN2003 (IN1–IN4), pela borda da frente e pela lateral direita */}
      <Fio cor="#e879f9" pontos={[[ard.x - 0.05, 0.12, ard.z + 0.22], [ard.x + 0.3, 0.03, 3.3], [3.4, 0.03, 3.3], [4.5, 0.03, 2.9], [4.55, 0.03, 1.4], [uln.x + 0.05, 0.03, uln.z + 0.3], [uln.x - 0.02, 0.06, uln.z + 0.16]]} />
      {/* Cabo de 5 vias do motor de passo até o conector do ULN2003 */}
      <Fio cor="#e8a33d" pontos={[[uln.x + 0.1, 0.08, uln.z - 0.16], [uln.x + 0.02, 0.03, uln.z - 0.38], [SEPARADOR.x, 0.06, SEPARADOR.z - 0.22]]} />
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
