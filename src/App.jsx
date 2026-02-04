import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

/**
 * Premium color system
 * (Muted, material-forward, non-neon)
 */
const PRODUCT_VARIANTS = [
  {
    name: "Obsidian Black",
    line: "Future Runner",
    material: "Matte Composite",
    color: "#1a1a1a"
  },
  {
    name: "Stone Grey",
    line: "Future Runner",
    material: "Engineered Mesh",
    color: "#b5b5b0"
  },
  {
    name: "Ivory White",
    line: "Future Runner",
    material: "Performance Knit",
    color: "#f2f2ee"
  }
];

function PlaceholderShoe({ onFirstInteraction }) {
  const meshRef = useRef();
  const materialRef = useRef();

  const [variantIndex, setVariantIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const targetColor = useRef(new THREE.Color(PRODUCT_VARIANTS[0].color));
  const idleTime = useRef(0);

  // Smooth color + motion logic
  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Cinematic idle presence
    idleTime.current += delta;
    meshRef.current.rotation.y += delta * 0.08;
    meshRef.current.rotation.x =
      Math.sin(idleTime.current * 0.4) * 0.04;

    // Hover / proximity response
    const targetTilt = isHovering ? 0.15 : 0;
    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      targetTilt,
      0.08
    );

    // Smooth color interpolation
    materialRef.current.color.lerp(targetColor.current, 0.06);
  });

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onFirstInteraction();
    }

    const nextIndex = (variantIndex + 1) % PRODUCT_VARIANTS.length;
    setVariantIndex(nextIndex);
    targetColor.current.set(PRODUCT_VARIANTS[nextIndex].color);
  };

  const activeVariant = PRODUCT_VARIANTS[variantIndex];

  return (
    <>
      <mesh
        ref={meshRef}
        onClick={handleInteraction}
        onPointerEnter={() => setIsHovering(true)}
        onPointerLeave={() => setIsHovering(false)}
      >
        <boxGeometry args={[2, 0.7, 0.8]} />
        <meshStandardMaterial
          ref={materialRef}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>

      {hasInteracted && (
        <Html
          position={[0, -1.1, 0]}
          center
          style={{
            color: "#e5e5e5",
            fontSize: "14px",
            letterSpacing: "0.04em",
            textAlign: "center",
            pointerEvents: "none"
          }}
        >
          <div>
            <div style={{ opacity: 0.9 }}>{activeVariant.name}</div>
            <div style={{ opacity: 0.5, fontSize: "12px" }}>
              {activeVariant.line} · {activeVariant.material}
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

export default function App() {
  const [identityRevealed, setIdentityRevealed] = useState(false);

  return (
    <div className="w-full h-full bg-black">
      <Canvas
        camera={{
          position: [3.2, 1.9, 4.6],
          fov: 45
        }}
        dpr={[1, 1.5]}
      >
        {/* Lighting — sculptural, not loud */}
        <ambientLight intensity={0.35} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
        />

        <directionalLight
          position={[-5, 2, -5]}
          intensity={0.6}
        />

        <PlaceholderShoe
          onFirstInteraction={() => setIdentityRevealed(true)}
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