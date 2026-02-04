import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF, ContactShadows, Environment as DreiEnv } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";

const PRODUCT_VARIANTS = [
  {
    name: "Obsidian Black",
    line: "Future Runner",
    material: "Matte Composite",
    color: "#1a1a1a",
    luminance: 0.1,
    finishBias: 0.05
  },
  {
    name: "Stone Grey",
    line: "Future Runner",
    material: "Engineered Mesh",
    color: "#b5b5b0",
    luminance: 0.55,
    finishBias: 0.0
  },
  {
    name: "Ivory White",
    line: "Future Runner",
    material: "Performance Knit",
    color: "#f2f2ee",
    luminance: 0.85,
    finishBias: -0.05
  }
];

/* -------------------- GROUND -------------------- */
function Ground({ variant, motionEnergy }) {
  const planeRef = useRef();

  useFrame(() => {
    if (!planeRef.current) return;
    const baseOpacity = THREE.MathUtils.lerp(0.35, 0.18, variant.luminance);
    const motionBoost = THREE.MathUtils.clamp(motionEnergy * 0.6, 0, 0.15);
    planeRef.current.material.opacity = THREE.MathUtils.lerp(
      planeRef.current.material.opacity,
      baseOpacity + motionBoost,
      0.08
    );
  });

  return (
    <mesh
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.45, 0]}
      receiveShadow
    >
      <planeGeometry args={[10, 10]} />
      <shadowMaterial transparent opacity={0.25} />
    </mesh>
  );
}

/* -------------------- ENVIRONMENT -------------------- */
function Environment({ variant, locked }) {
  const fogRef = useRef();
  const sphereRef = useRef();

  useFrame(() => {
    if (!fogRef.current || !sphereRef.current) return;
    const fogTarget = THREE.MathUtils.lerp(0.028, 0.04, 1 - variant.luminance);
    fogRef.current.density = THREE.MathUtils.lerp(
      fogRef.current.density,
      locked ? fogTarget : fogTarget * 0.85,
      0.02
    );
    const emissiveTarget = THREE.MathUtils.lerp(0.18, 0.28, 1 - variant.luminance);
    sphereRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      sphereRef.current.material.emissiveIntensity,
      emissiveTarget,
      0.02
    );
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

      {/* Optional subtle environment reflections */}
      <DreiEnv preset="studio" />
    </>
  );
}

/* -------------------- CAMERA PRESENCE -------------------- */
function CameraAuthority() {
  const t = useRef(0);
  const offset = useRef(0);

  useFrame(({ camera }) => {
    t.current += 0.0015;
    offset.current = THREE.MathUtils.lerp(offset.current, 0.15, 0.005);
    camera.position.x += Math.sin(t.current) * 0.0015 * offset.current;
    camera.position.y += Math.sin(t.current * 0.7) * 0.0012 * offset.current;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* -------------------- SHOE -------------------- */
function Shoe({ variantIndex, onVariantChange, onFirstInteract }) {
  const groupRef = useRef();
  const rimLightRef = useRef();
  const variant = PRODUCT_VARIANTS[variantIndex];
  const targetColor = useRef(new THREE.Color(variant.color));
  const motionEnergy = useRef(0);
  const angularVelocity = useRef(0);
  const rotationVelocity = useRef(0);
  const isUserActive = useRef(false);
  const pointerOffset = useRef([0, 0]);
  const [textVisible, setTextVisible] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Load GLTF shoe model
  const { scene } = useGLTF("/models/shoe.glb", true);

  // Memoize materials for performance
  const meshes = useMemo(() => {
    const meshArr = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = child.material.clone();
        child.material.color = targetColor.current;
        child.material.roughness = 0.45 + variant.finishBias;
        child.material.metalness = 0.12;
        meshArr.push(child);
      }
    });
    scene.rotation.y = 0;
    scene.scale.set(2, 2, 2);
    return meshArr;
  }, [scene, variantIndex]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (!isUserActive.current) {
      rotationVelocity.current = THREE.MathUtils.lerp(rotationVelocity.current, 0.04, 0.02);
    }

    angularVelocity.current = THREE.MathUtils.lerp(angularVelocity.current, rotationVelocity.current, 0.08);
    groupRef.current.rotation.y += angularVelocity.current * delta;
    rotationVelocity.current *= 0.95;

    // Micro sway
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointerOffset.current[1] * 0.12, 0.06);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, pointerOffset.current[0] * 0.12, 0.06);

    motionEnergy.current = THREE.MathUtils.lerp(
      motionEnergy.current,
      Math.abs(angularVelocity.current) + Math.abs(pointerOffset.current[0]) + Math.abs(pointerOffset.current[1]),
      0.1
    );

    // Update all shoe mesh materials
    meshes.forEach((mesh) => {
      mesh.material.color.lerp(targetColor.current, 0.05);
      mesh.material.roughness = THREE.MathUtils.lerp(mesh.material.roughness, 0.45 + variant.finishBias, 0.05);
    });

    // Rim light response
    if (rimLightRef.current) {
      const proximity = Math.min(1, 0.5 + Math.abs(pointerOffset.current[0]) + Math.abs(pointerOffset.current[1]));
      rimLightRef.current.position.copy(state.camera.position);
      rimLightRef.current.intensity = THREE.MathUtils.lerp(
        rimLightRef.current.intensity,
        THREE.MathUtils.lerp(0.35, 0.18, variant.luminance) + proximity * 0.15,
        0.05
      );
    }

    // Text fade logic
    if (motionEnergy.current > 0.6 && textVisible) setTextVisible(false);
    if (motionEnergy.current < 0.12 && !textVisible) setTextVisible(true);
  });

  const handlePointerMove = (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    pointerOffset.current = [x, -y];
  };

  const handlePointerDown = () => {
    isUserActive.current = true;
    if (!hasInteracted) {
      setHasInteracted(true);
      onFirstInteract();
    }
  };

  const handlePointerUp = () => {
    isUserActive.current = false;
    pointerOffset.current = [0, 0];
  };

  const handleClick = () => {
    const next = (variantIndex + 1) % PRODUCT_VARIANTS.length;
    targetColor.current.set(PRODUCT_VARIANTS[next].color);
    onVariantChange(next);
  };

  return (
    <>
      <directionalLight ref={rimLightRef} intensity={0.2} castShadow={false} />
      <group
        ref={groupRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <primitive object={scene} />
      </group>

      {/* Cinematic contact shadows */}
      <ContactShadows
        position={[0, -0.45, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        opacity={0.4}
        width={6}
        height={6}
        blur={1.5}
        far={1.5}
      />

      {textVisible && (
        <Html
          position={[0, -1.15, 0]}
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
      )}

      <Ground variant={variant} motionEnergy={motionEnergy.current} />
    </>
  );
}

/* -------------------- APP ROOT -------------------- */
export default function App() {
  const [variantIndex, setVariantIndex] = useState(0);
  const [locked, setLocked] = useState(false);

  return (
    <div className="w-full h-full bg-black">
      <Canvas
        shadows
        camera={{
          position: [3.2, 1.9, 4.6],
          fov: 45,
          near: 0.1,
          far: 100
        }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[5, 6, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={15}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <directionalLight position={[-5, 2, -5]} intensity={0.6} />

        <Environment variant={PRODUCT_VARIANTS[variantIndex]} locked={locked} />
        <CameraAuthority />

        <Shoe
          variantIndex={variantIndex}
          onVariantChange={setVariantIndex}
          onFirstInteract={() => setLocked(true)}
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