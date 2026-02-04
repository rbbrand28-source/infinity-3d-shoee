import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

/* ---------------- PRODUCT DNA ---------------- */

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

/* ---------------- ENVIRONMENT ---------------- */

function Environment({ variant }) {
  const fogRef = useRef();
  const sphereRef = useRef();

  useFrame(() => {
    if (fogRef.current) {
      fogRef.current.density = THREE.MathUtils.lerp(
        fogRef.current.density,
        THREE.MathUtils.lerp(0.028, 0.04, 1 - variant.luminance),
        0.02
      );
    }

    if (sphereRef.current) {
      sphereRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        sphereRef.current.material.emissiveIntensity,
        THREE.MathUtils.lerp(0.18, 0.28, 1 - variant.luminance),
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
        />
      </mesh>
    </>
  );
}

/* ---------------- CAMERA AUTHORITY ---------------- */

function CameraAuthority() {
  const t = useRef(0);

  useFrame(({ camera }, delta) => {
    t.current += delta * 0.15;
    camera.position.x += Math.sin(t.current) * 0.0018;
    camera.position.y += Math.sin(t.current * 0.7) * 0.0016;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ---------------- SHOE OBJECT ---------------- */

function PlaceholderShoe({ variantIndex, onVariantChange }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const rimLightRef = useRef();

  const targetColor = useRef(
    new THREE.Color(PRODUCT_VARIANTS[variantIndex].color)
  );

  const angularVelocity = useRef(0);
  const rotationVelocity = useRef(0);
  const isUserActive = useRef(false);

  const [textVisible, setTextVisible] = useState(true);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    if (!isUserActive.current) {
      rotationVelocity.current = THREE.MathUtils.lerp(
        rotationVelocity.current,
        0.05,
        0.02
      );
    }

    angularVelocity.current = THREE.MathUtils.lerp(
      angularVelocity.current,
      rotationVelocity.current,
      0.08
    );

    meshRef.current.rotation.y += angularVelocity.current * delta;
    rotationVelocity.current *= 0.96;

    materialRef.current.color.lerp(targetColor.current, 0.05);

    /* Rim light tracks camera */
    if (rimLightRef.current) {
      rimLightRef.current.position.copy(state.camera.position);
      rimLightRef.current.intensity = THREE.MathUtils.lerp(
        rimLightRef.current.intensity,
        THREE.MathUtils.lerp(
          0.35,
          0.18,
          PRODUCT_VARIANTS[variantIndex].luminance
        ),
        0.04
      );
    }

    /* Text discipline */
    const motion = Math.abs(angularVelocity.current);
    if (motion > 0.6 && textVisible) setTextVisible(false);
    if (motion < 0.12 && !textVisible) setTextVisible(true);
  });

  const handleClick = () => {
    const next = (variantIndex + 1) % PRODUCT_VARIANTS.length;
    targetColor.current.set(PRODUCT_VARIANTS[next].color);
    onVariantChange(next);
  };

  return (
    <>
      {/* Primary rim */}
      <directionalLight ref={rimLightRef} intensity={0.2} />

      {/* Invisible authority light (Obsidian saver) */}
      <directionalLight
        position={[-3, 1.5, -4]}
        intensity={0.12}
        color="#ffffff"
      />

      <mesh
        ref={meshRef}
        onPointerDown={() => (isUserActive.current = true)}
        onPointerUp={() => (isUserActive.current = false)}
        onClick={handleClick}
      >
        <boxGeometry args={[2, 0.7, 0.8]} />
        <meshStandardMaterial
          ref={materialRef}
          roughness={0.45}
          metalness={0.12}
          envMapIntensity={0.4}
        />
      </mesh>

      {textVisible && (
        <Html
          position={[0, -1.15, 0]}
          center
          style={{
            color: "#e6e6e6",
            fontSize: "14px",
            letterSpacing: "0.04em",
            textAlign: "center",
            pointerEvents: "none",
            transition: "opacity 0.4s ease"
          }}
        >
          <div>
            <div>{PRODUCT_VARIANTS[variantIndex].name}</div>
            <div style={{ opacity: 0.5, fontSize: "12px" }}>
              {PRODUCT_VARIANTS[variantIndex].line} ·{" "}
              {PRODUCT_VARIANTS[variantIndex].material}
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

/* ---------------- APP ROOT ---------------- */

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

        <Environment variant={PRODUCT_VARIANTS[variantIndex]} />
        <CameraAuthority />

        <PlaceholderShoe
          variantIndex={variantIndex}
          onVariantChange={setVariantIndex}
        />

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.12}
          rotateSpeed={0.55}
          zoomSpeed={0.8}
          minDistance={3.5}
          maxDistance={6}
        />
      </Canvas>
    </div>
  );
}