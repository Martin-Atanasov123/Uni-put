import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const N = 52;
const CONNECT_D = 10;

function Scene({ mouseRef, rotationRef }) {
    const attrRef = useRef();
    const groupRef = useRef();

    const { pos, base, lines } = useMemo(() => {
        const base = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            base[i * 3] = (Math.random() - 0.5) * 36;
            base[i * 3 + 1] = (Math.random() - 0.5) * 26;
            base[i * 3 + 2] = (Math.random() - 0.5) * 7;
        }

        const pos = new Float32Array(base);

        const lineArr = [];
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dx = base[i * 3] - base[j * 3];
                const dy = base[i * 3 + 1] - base[j * 3 + 1];
                const dz = base[i * 3 + 2] - base[j * 3 + 2];
                if (dx * dx + dy * dy + dz * dz < CONNECT_D * CONNECT_D) {
                    lineArr.push(
                        base[i * 3], base[i * 3 + 1], base[i * 3 + 2],
                        base[j * 3], base[j * 3 + 1], base[j * 3 + 2]
                    );
                }
            }
        }

        return { pos, base, lines: new Float32Array(lineArr) };
    }, []);

    useFrame(({ clock }) => {
        if (!attrRef.current || !groupRef.current) return;

        const t = clock.getElapsedTime();
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const arr = attrRef.current.array;

        // Update positions with mouse offset
        for (let i = 0; i < N; i++) {
            arr[i * 3] = base[i * 3] + mx * 1.6 + Math.sin(t * 0.22 + i * 0.71) * 0.18;
            arr[i * 3 + 1] = base[i * 3 + 1] + my * 1.6 + Math.cos(t * 0.27 + i * 0.53) * 0.18;
            arr[i * 3 + 2] = base[i * 3 + 2] + Math.sin(t * 0.45 + i * 0.3) * 0.35;
        }
        attrRef.current.needsUpdate = true;

        // Apply drag rotation
        groupRef.current.rotation.x = rotationRef.current.x;
        groupRef.current.rotation.y = rotationRef.current.y;
        groupRef.current.rotation.z = rotationRef.current.z;
    });

    return (
        <group ref={groupRef}>
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        ref={attrRef}
                        attach="attributes-position"
                        args={[pos, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#06B6D4"
                    size={0.22}
                    transparent
                    opacity={0.85}
                    sizeAttenuation
                />
            </points>

            {lines.length > 0 && (
                <lineSegments>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[lines, 3]}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#8B5CF6" transparent opacity={0.13} />
                </lineSegments>
            )}
        </group>
    );
}

export default function InteractiveConstellation() {
    const mouseRef = useRef({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const rotationRef = useRef({ x: 0, y: 0, z: 0 });
    const targetRotationRef = useRef({ x: 0, y: 0, z: 0 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const canvasRef = useRef();

    useEffect(() => {
        let raf;
        const lerp = () => {
            mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.055;
            mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.055;

            // Smooth rotation towards drag target
            rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.1;
            rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.1;

            raf = requestAnimationFrame(lerp);
        };
        lerp();

        const onMove = (e) => {
            targetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
            targetRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        };

        const onMouseDown = (e) => {
            isDraggingRef.current = true;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e) => {
            if (!isDraggingRef.current) return;

            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;

            targetRotationRef.current.y = deltaX * 0.015;
            targetRotationRef.current.x = deltaY * 0.015;

            dragStartRef.current = { x: e.clientX, y: e.clientY };
        };

        const onMouseUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener('mousemove', onMove, { passive: true });

        const canvas = canvasRef.current?.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', onMouseDown);
            canvas.addEventListener('mousemove', onMouseMove);
            canvas.style.cursor = 'grab';
        }
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onMouseUp);
            if (canvas) {
                canvas.removeEventListener('mousedown', onMouseDown);
                canvas.removeEventListener('mousemove', onMouseMove);
            }
        };
    }, []);

    return (
        <div ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [0, 0, 24], fov: 75 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                dpr={[1, 1.5]}
            >
                <Scene mouseRef={mouseRef} rotationRef={rotationRef} />
            </Canvas>
        </div>
    );
}
