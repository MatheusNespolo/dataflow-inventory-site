"use client";
// Cena 3D fixa ao fundo da página. A rolagem (sceneState) decide a câmera e a visibilidade.
import {
  Environment, Lightformer, MeshReflectorMaterial, PerformanceMonitor, Sparkles,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Bench } from "./Bench";
import { DataStream, Steam } from "./Effects";
import { ELETRONICA, PRINCIPAL, SECUNDARIA } from "./layout";
import { sceneState } from "./sceneState";

/** `alvoRetrato`: alvo opcional em telas em pé (o texto fica embaixo, a cena precisa ir para o centro). */
type Quadro = { pos: THREE.Vector3; alvo: THREE.Vector3; alvoRetrato?: THREE.Vector3 };
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Enquadramentos dos 6 capítulos da história (mesma ordem de content.capitulos). */
const QUADROS: Quadro[] = [
  { pos: v(-1.4, 4.8, 9.6), alvo: v(-2.2, 0.3, 0.3) }, // 01 o clique — visão geral (bancada à direita do texto)
  { pos: v(-1.2, 10.5, 5.2), alvo: v(-0.4, 0, 0.6) }, // 02 a nuvem — de cima, com o fluxo descendo
  { pos: v(ELETRONICA.esp32.x + 1.3, 1.45, ELETRONICA.esp32.z + 1.9), alvo: v(ELETRONICA.esp32.x - 0.1, 0.2, ELETRONICA.esp32.z) }, // 03 gateway
  { pos: v(ELETRONICA.arduino.x + 0.9, 1.6, ELETRONICA.arduino.z + 2.1), alvo: v((ELETRONICA.arduino.x + ELETRONICA.oled.x) / 2, 0.3, ELETRONICA.arduino.z) }, // 04 decisão
  { pos: v(3.4, 3.3, SECUNDARIA.zInicio - 2.2), alvo: v(-0.6, 0.6, -0.4) }, // 05 movimento — ao longo da esteira B
  { pos: v(0.6, 5, PRINCIPAL.z + 4.85), alvo: v(2.2, 0.3, PRINCIPAL.z - 0.35), alvoRetrato: v(3.5, 0.3, PRINCIPAL.z - 0.25) }, // 06 entrega — junção, principal e roda separadora
];

const suave = (x: number) => x * x * (3 - 2 * x);

function Rig({ modelo }: { modelo: React.RefObject<THREE.Group | null> }) {
  const { camera, size } = useThree();
  const giro = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const alvo = useMemo(() => new THREE.Vector3(), []);
  const alvoAtual = useMemo(() => new THREE.Vector3(0, 0.5, 0.3), []);
  const heroPos = useMemo(() => new THREE.Vector3(), []);
  const heroAlvo = useMemo(() => new THREE.Vector3(), []);
  const p = useRef({ x: 0, y: 0 });

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const s = sceneState;
    const retrato = size.width / size.height < 1;
    const recuo = retrato ? 1.75 : 1;

    // Ponteiro amortecido.
    p.current.x = THREE.MathUtils.damp(p.current.x, s.pointer.x, 3, d);
    p.current.y = THREE.MathUtils.damp(p.current.y, s.pointer.y, 3, d);

    // Hero: câmera frontal com parallax; ao rolar, sobe e se aproxima.
    // O alvo fica abaixo do modelo: a bancada sobe para o terço superior e o título ocupa a base.
    heroPos.set(p.current.x * 1.1, (4.4 + p.current.y * 0.6 + s.heroOut * 2.4) * (retrato ? 1.25 : 1), (13 - s.heroOut * 2.5) * recuo);
    heroAlvo.set(0, -1.7 + s.heroOut * 1.9, 0.3);

    // História: interpola entre os quadros vizinhos.
    const n = QUADROS.length - 1;
    const st = THREE.MathUtils.clamp(s.story, 0, n);
    const i = Math.min(Math.floor(st), n - 1);
    const k = suave(THREE.MathUtils.clamp(st - i, 0, 1));
    pos.lerpVectors(QUADROS[i].pos, QUADROS[i + 1].pos, k);
    const alvoDe = (q: Quadro) => (retrato && q.alvoRetrato) || q.alvo;
    alvo.lerpVectors(alvoDe(QUADROS[i]), alvoDe(QUADROS[i + 1]), k);
    if (retrato) pos.sub(alvo).multiplyScalar(1.45).add(alvo);

    const mix = suave(THREE.MathUtils.clamp(s.storyMix, 0, 1));
    pos.lerpVectors(heroPos, pos, mix);
    alvo.lerpVectors(heroAlvo, alvo, mix);

    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, 4, d);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, 4, d);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, 4, d);
    alvoAtual.x = THREE.MathUtils.damp(alvoAtual.x, alvo.x, 4, d);
    alvoAtual.y = THREE.MathUtils.damp(alvoAtual.y, alvo.y, 4, d);
    alvoAtual.z = THREE.MathUtils.damp(alvoAtual.z, alvo.z, 4, d);
    camera.lookAt(alvoAtual);

    // Giro lento do modelo no hero; na história ele volta ao ângulo de referência.
    if (!s.reducedMotion) giro.current += d * 0.16;
    const ang = THREE.MathUtils.euclideanModulo(giro.current + Math.PI, Math.PI * 2) - Math.PI;
    if (modelo.current) modelo.current.rotation.y = (ang * 0.55 + p.current.x * 0.12) * (1 - mix);
  });
  return null;
}

/** Luzes roxas que orbitam o modelo (reflexos que "andam" pelo alumínio). */
function LuzesDinamicas() {
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = sceneState.reducedMotion ? 0 : clock.elapsedTime;
    a.current?.position.set(Math.cos(t * 0.35) * 6, 2.6 + Math.sin(t * 0.7) * 0.6, Math.sin(t * 0.35) * 5);
    b.current?.position.set(Math.cos(t * 0.35 + Math.PI) * 6, 1.8, Math.sin(t * 0.35 + Math.PI) * 5);
    if (a.current) a.current.intensity = 22 + Math.sin(t * 1.7) * 6;
  });
  return (
    <>
      <pointLight ref={a} color="#8b3dff" intensity={22} distance={14} decay={2} />
      <pointLight ref={b} color="#d946ef" intensity={12} distance={12} decay={2} />
    </>
  );
}

function Piso({ simples }: { simples: boolean }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      {simples ? (
        <meshStandardMaterial color="#07050a" roughness={0.6} metalness={0.4} />
      ) : (
        <MeshReflectorMaterial
          blur={[380, 120]}
          resolution={512}
          mixBlur={1}
          mixStrength={1.6}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#07050b"
          metalness={0.6}
          mirror={0.6}
        />
      )}
    </mesh>
  );
}

export default function Experience() {
  const modelo = useRef<THREE.Group>(null);
  const casca = useRef<HTMLDivElement>(null);
  const [dpr, setDpr] = useState(1.5);
  const [ativo, setAtivo] = useState(true);
  // Só roda no navegador (o componente é carregado sem SSR).
  const [movel] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    // A rolagem escreve sceneState.visibility; aqui só ligamos/desligamos o laço de render.
    let ultimo = true;
    const id = window.setInterval(() => {
      if (casca.current) casca.current.style.opacity = String(sceneState.visibility);
      const agora = sceneState.visibility > 0.01;
      if (agora !== ultimo) {
        ultimo = agora;
        setAtivo(agora);
      }
    }, 120);
    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={casca} className="fixed inset-0 z-0 transition-opacity duration-300" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, dpr]}
        frameloop={ativo ? "always" : "never"}
        camera={{ position: [0, 4.4, 13], fov: 32, near: 0.1, far: 80 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <color attach="background" args={["#050307"]} />
        <fog attach="fog" args={["#050307", 14, 34]} />

        <ambientLight intensity={0.12} />
        <hemisphereLight args={["#b9a2ff", "#050307", 0.25]} />
        <spotLight
          position={[4, 9, 6]}
          angle={0.45}
          penumbra={0.8}
          intensity={160}
          color="#f3ecff"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-6, 4, -6]} intensity={1.6} color="#8b3dff" />
        {/* Recorte roxo por trás: desenha a silhueta das esteiras contra o fundo */}
        <spotLight position={[0, 5, -9]} angle={0.6} penumbra={1} intensity={260} color="#9d5cff" />
        <LuzesDinamicas />

        <Suspense fallback={null}>
          {/* Ambiente só com Lightformers: reflexos realistas sem baixar HDR da rede. */}
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
            <Lightformer form="rect" intensity={3} color="#8b3dff" position={[-7, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
            <Lightformer form="rect" intensity={2} color="#d946ef" position={[7, 2, -2]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
            <Lightformer form="ring" intensity={1.5} color="#e9dcff" position={[0, 3, -8]} scale={4} />
          </Environment>

          <group ref={modelo}>
            <Bench />
            <Steam />
            <DataStream />
          </group>
          <Piso simples={movel} />
          <Sparkles count={movel ? 40 : 90} scale={[14, 5, 10]} position={[0, 2.2, 0]} size={2.2} speed={0.25} opacity={0.6} color="#b388ff" />
          <Sparkles count={movel ? 12 : 30} scale={[10, 3, 8]} position={[0, 1.5, 0]} size={4} speed={0.15} opacity={0.35} color="#f0e2ff" />
        </Suspense>

        <Rig modelo={modelo} />

        <EffectComposer multisampling={movel ? 0 : 4}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
