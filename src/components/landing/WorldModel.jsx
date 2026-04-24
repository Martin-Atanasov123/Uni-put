import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows } from "@react-three/drei";

useGLTF.preload("/hero_model.glb");

function Model() {
    const group = useRef();
    const { scene } = useGLTF("/hero_model.glb");

    useFrame((_, delta) => {
        if (group.current) {
            group.current.rotation.y += delta * 0.22;
        }
    });

    return (
        <group ref={group} position={[0, -0.5, 0]}>
            <primitive object={scene} scale={1.8} />
        </group>
    );
}

export default function WorldModel({ style }) {
    return (
        <Canvas
            camera={{ position: [0, 1.5, 5], fov: 42 }}
            style={{ background: "transparent", ...style }}
            gl={{
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
                toneMapping: 4, // ACESFilmicToneMapping
                toneMappingExposure: 1.2,
            }}
            dpr={[1, 1.5]}
        >
            <Suspense fallback={null}>
                {/* Iridescence needs good environment lighting */}
                <Environment preset="studio" />

                {/* Cyan accent light */}
                <pointLight
                    position={[-3, 3, 2]}
                    intensity={8}
                    color="#06B6D4"
                    distance={12}
                />
                {/* Violet accent light */}
                <pointLight
                    position={[3, -1, 3]}
                    intensity={6}
                    color="#8B5CF6"
                    distance={10}
                />
                {/* Soft fill */}
                <ambientLight intensity={0.4} />

                <Model />

                <ContactShadows
                    position={[0, -2, 0]}
                    opacity={0.25}
                    scale={6}
                    blur={2}
                    color="#06B6D4"
                />
            </Suspense>
        </Canvas>
    );
}
