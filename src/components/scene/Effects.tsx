"use client";
// Vapor do motor principal e o fluxo de dados (nuvem → ESP32 → Arduino) dos capítulos 02–04.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BASE, ELETRONICA, PRINCIPAL } from "./layout";
import { sceneState } from "./sceneState";
import { steamTexture } from "./textures";

// ------------------------------------------------------------
// Vapor: sopros que nascem no motor, sobem, crescem e somem.
// ------------------------------------------------------------
const N_VAPOR = 22;

export function Steam() {
  const tex = useMemo(() => steamTexture(), []);
  const malha = useRef<THREE.InstancedMesh>(null);
  const origem = useMemo(
    () => new THREE.Vector3(PRINCIPAL.comprimento / 2, PRINCIPAL.topo + 0.12 + BASE.h / 2, PRINCIPAL.z + PRINCIPAL.largura / 2 + 0.33),
    [],
  );
  const sementes = useMemo(
    () => Array.from({ length: N_VAPOR }, (_, i) => ({ fase: i / N_VAPOR, deriva: Math.random() * Math.PI * 2, giro: Math.random() * 6 })),
    [],
  );
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        color: new THREE.Color("#e9dcff"),
        opacity: 0.16,
      }),
    [tex],
  );
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const tempo = useRef(0);

  useFrame(({ camera }, dt) => {
    if (!malha.current) return;
    if (!sceneState.reducedMotion) tempo.current += Math.min(dt, 0.05);
    const t = tempo.current;
    sementes.forEach((s, i) => {
      const vida = (t * 0.22 + s.fase) % 1; // 0 → nasce, 1 → some
      tmp.position.set(
        origem.x + Math.sin(s.deriva + t * 0.6) * 0.18 * vida,
        origem.y + vida * 1.6,
        origem.z + Math.cos(s.deriva + t * 0.4) * 0.14 * vida,
      );
      tmp.quaternion.copy(camera.quaternion); // billboard
      tmp.rotateZ(s.giro + t * 0.15);
      // Cresce ao subir e encolhe no fim, para sumir sem corte seco.
      tmp.scale.setScalar((0.25 + vida * 0.9) * Math.sin(vida * Math.PI));
      tmp.updateMatrix();
      malha.current!.setMatrixAt(i, tmp.matrix);
    });
    malha.current.instanceMatrix.needsUpdate = true;
    // Opacidade média pulsando de leve (instâncias não têm opacidade individual no material básico).
    material.opacity = 0.11 + 0.04 * Math.sin(t * 1.3);
  });

  return <instancedMesh ref={malha} args={[undefined, material, N_VAPOR]} frustumCulled={false} renderOrder={2} />;
}

// ------------------------------------------------------------
// Fluxo de dados: pacotes luminosos descendo da "nuvem" até o ESP32 e dele ao Arduino.
// ------------------------------------------------------------
const N_PACOTES = 26;

export function DataStream() {
  const malha = useRef<THREE.InstancedMesh>(null);
  const linha = useRef<THREE.Mesh>(null);
  const esp = ELETRONICA.esp32;
  const ard = ELETRONICA.arduino;

  const curva = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.5, 7.5, -3.5),
        new THREE.Vector3(-0.5, 4.5, -0.5),
        new THREE.Vector3(esp.x, 1.4, esp.z - 0.2),
        new THREE.Vector3(esp.x, 0.32, esp.z),
        new THREE.Vector3((esp.x + ard.x) / 2, 0.6, esp.z + 0.25),
        new THREE.Vector3(ard.x + 0.1, 0.3, ard.z),
      ]),
    [esp, ard],
  );
  const tubo = useMemo(() => new THREE.TubeGeometry(curva, 160, 0.008, 6, false), [curva]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const ponto = useMemo(() => new THREE.Vector3(), []);
  const tempo = useRef(0);

  useFrame((_, dt) => {
    if (!malha.current || !linha.current) return;
    tempo.current += Math.min(dt, 0.05) * (sceneState.reducedMotion ? 0 : 1);
    // Visível nos capítulos 02 (nuvem), 03 (gateway) e 04 (decisão).
    const s = sceneState.story;
    const janela = THREE.MathUtils.smoothstep(s, 0.6, 1.2) * (1 - THREE.MathUtils.smoothstep(s, 3.6, 4.2));
    const vis = janela * sceneState.storyMix;
    (linha.current.material as THREE.MeshBasicMaterial).opacity = vis * 0.35;
    linha.current.visible = vis > 0.01;
    malha.current.visible = vis > 0.01;
    for (let i = 0; i < N_PACOTES; i++) {
      const u = (tempo.current * 0.16 + i / N_PACOTES) % 1;
      curva.getPointAt(u, ponto);
      tmp.position.copy(ponto);
      tmp.scale.setScalar(vis * (0.6 + 0.4 * Math.sin(u * Math.PI)));
      tmp.updateMatrix();
      malha.current.setMatrixAt(i, tmp.matrix);
    }
    malha.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, BASE.h / 2, 0]}>
      <mesh ref={linha} geometry={tubo}>
        <meshBasicMaterial color="#a970ff" transparent opacity={0} toneMapped={false} />
      </mesh>
      <instancedMesh ref={malha} args={[undefined, undefined, N_PACOTES]} frustumCulled={false}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#f0e2ff" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
