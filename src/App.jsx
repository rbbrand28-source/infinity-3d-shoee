import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";

/**
 * Premium product variants
 * (Luxury-safe luminance values)
 */
const PRODUCT_VARIANTS = [
  {
    name: "Obsidian Black",
    line: "Future Runner",
    material: "Matte Composite",
    color: "#1a1a1a",
    luminance: 0.1
  },
  {
    name: "Stone Grey",
    line: "Future Runner",
    material: "Engineered Mesh",
    color: "#b5b5b0",
    luminance: 0.55
  },
  {
    name: "Ivory White",
    line: "Future Runner",
    material: "Performance Knit",
    color: "#f2f2ee",
    luminance: 0.85
  }
];

/**
 * Adaptive environment
 * reacts to product luminance
 */
function Environment({ activeVariant }) {
  const fogRef = useRef();
  const sphereRef = useRef();

  const targetFog = useMemo(
    () => THREE.MathUtils.lerp(0.028, 0.042, 1 - activeVariant.luminance),
    [activeVariant]
  );

  const targetEmissive = useMemo(
    () => THREE.MathUtils.lerp(0.18, 0.3, 1 - activeVariant.luminance),
    [activeVariant]
  );

  useFrame(() => {
    if (fogRef.current) {
      fogRef.current.density = THREE.MathUtils.lerp(
        fogRef.current.density,
        targetFog,
        0.02
      );
    }

    if (sphereRef.current) {
      sphereRef.current.material.emissiveIntensity =
        THREE.MathUtils.lerp(
          sphereRef.current.material.emissiveIntensity,
          targetEmissive,
          0.02
        );
    }
  });

  return (
    <>
      <fogExp2 ref={fogRef} args={["#0b0b0c", 0.03]} />
      <mesh ref={sphereRef} scale={50}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          side={THREE.BackSide}
          color="#0f0f12"
          emissive="#1a1a1f"
          emissiveIntensity={0.2}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </>
  );
}

/**
 * Subtle camera life
 */
function CameraPresence() {
  const t = useRef(0);

  useFrame(({ camera }, delta) => {
    t.current += delta * 0.15;
    camera.position.x += Math.sin(t.current) * 0.002;
    camera.position.y += Math.sin(t.current * 0.7) * 0.002;
  });

  return null;
}

/**
 * Placeholder shoe (premium behavior)
 */
function PlaceholderShoe({ variantIndex, onChange }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const rimLightRef = useRef();

  const variant = PRODUCT_VARIANTS[variantIndex];
  const targetColor = useRef(new THREE.Color(variant.color));
  const idle = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    idle.current += delta;

    // Cinematic idle motion
    meshRef.current.rotation.y += delta * 0.06;
    meshRef.current.rotation.x =
      Math.sin(idle.current * 0.4) * 0.035;

    // Smooth color transition
    materialRef.current.color.lerp(targetColor.current, 0.05);

    // Adaptive rim light (critical for dark variant)
    if (rimLightRef.current) {
      rimLightRef.current.position.copy(state.camera.position);

      const base = THREE.MathUtils.lerp(
        0.45,
        0.25,
        variant.luminance
      );

      const obsidianBoost = variant.luminance < 0.2 ? 0.25 : 0;

      rimLightRef.current.intensity = THREE.MathUtils.lerp(
        rimLightRef.current.intensity,
        base + obsidianBoost,
        0.06
      );
    }
  });

  const handleClick = () => {
    const next = (variantIndex + 1) % PRODUCT_VARIANTS.length;
    targetColor.current.set(PRODUCT_VARIANTS[next].color);
    onChange(next);
  };

  return (
    <>
      {/* Rim / edge definition light */}
      <directionalLight
        ref={rimLightRef}
        intensity={0.3}
        color="#ffffff"
      />

      <mesh
        ref={meshRef}
        onClick={handleClick}
        scale={variant.luminance < 0.2 ? 1.02 : 1}
      >
        <boxGeometry args={[2, 0.7, 0.8]} />
        <meshStandardMaterial
          ref={materialRef}
          roughness={0.45}
          metalness={0.12}
          envMapIntensity={
            variant.luminance < 0.2 ? 0.75 : 0.45
          }
        />
      </mesh>

      <Html
        position={[0, -1.1, 0]}
        center
        style={{
          color: "#e6e6e6",
          fontSize: "14px",
          letterSpacing: "0.04em",
          textAlign: "center",
          pointerEvents: "none"
        }}
      >
        <div>
          <div>{variant.name}</div>
          <div style={{ opacity: 0.5, fontSize: "12px" }}>
            {variant.line} · {variant.material}
          </div>
        </div>
      </Html>
    </>
  );
}

export default function App() {
  const [variantIndex, setVariantIndex] = useState(0);

  return (
    <div className="w-full h-full bg-black">
      <Canvas
        camera={{
          position: [3.2, 1.9, 4.6],
          fov: 45,
          near: 0.1,
          far: 100
        }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.28} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, 2, -5]} intensity={0.6} />

        <Environment activeVariant={PRODUCT_VARIANTS[variantIndex]} />
        <CameraPresence />

        <PlaceholderShoe
          variantIndex={variantIndex}
          onChange={setVariantIndex}
        />

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
    </div>
  );
}