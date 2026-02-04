import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html
} from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

/**
 * Premium shoe variants
 */
const VARIANTS = [
  {
    name: "Obsidian Black",
    material: "Matte Composite",
    color: "#1a1a1a"
  },
  {
    name: "Stone Grey",
    material: "Engineered Mesh",
    color: "#b5b5b0"
  },
  {
    name: "Ivory White",
    material: "Performance Knit",
    color: "#f2f2ee"
  }
];

function Shoe() {
  const meshRef = useRef();
  const materialRef = useRef();

  const [index, setIndex] = useState(0);
  const targetColor = useRef(
    new THREE.Color(VARIANTS[0].color)
  );

  const idle = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    idle.current += delta;

    // Cinematic idle motion
    meshRef.current.rotation.y += delta * 0.08;
    meshRef.current.rotation.x =
      Math.sin(idle.current * 0.4) * 0.04;

    // Smooth color blend
    materialRef.current.color.lerp(targetColor.current, 0.06);
  });

  const cycleColor = () => {
    const next = (index + 1) % VARIANTS.length;
    setIndex(next);
    targetColor.current.set(VARIANTS[next].color);
  };

  const active = VARIANTS[index];

  return (
    <>
      <mesh
        ref={meshRef}
        onClick={cycleColor}
        castShadow
        receiveShadow
      >
        {/* Placeholder shoe geometry */}
        <boxGeometry args={[2, 0.7, 0.9]} />

        <meshStandardMaterial
          ref={materialRef}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Floating product label */}
      <Html position={[0, -1.1, 0]} center>
        <div
          style={{
            color: "#e5e5e5",
            fontSize: "13px",
            textAlign: "center",
            letterSpacing: "0.04em",
            pointerEvents: "none"
          }}
        >
          <div>{active.name}</div>
          <div style={{ opacity: 0.5, fontSize: "12px" }}>
            {active.material}
          </div>
        </div>
      </Html>
    </>
  );
}

export default function ShoeCanvas() {
  return (
    <Canvas
      camera={{ position: [3.2, 1.9, 4.6], fov: 45 }}
      shadows
      dpr={[1, 1.5]}
    >
      {/* Base ambience */}
      <ambientLight intensity={0.25} />

      {/* Key light */}
      <directionalLight
        position={[5, 6, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Fill light */}
      <directionalLight
        position={[-4, 2, -4]}
        intensity={0.4}
      />

      {/* Environment reflections */}
      <Environment preset="city" />

      {/* Shoe */}
      <Shoe />

      {/* Ground contact shadow */}
      <ContactShadows
        position={[0, -0.6, 0]}
        opacity={0.35}
        blur={2.5}
        scale={10}
      />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        minDistance={3.5}
        maxDistance={6}
      />
    </Canvas>
  );
}