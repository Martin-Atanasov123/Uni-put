import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

/**
 * Model Loader - loads .glb/.gltf from your /public folder
 * To use: Download a .glb model and put it in /public/models/book.glb
 * Then change the path below
 */
function Model({ modelPath = '/models/book.glb' }) {
    const { scene } = useGLTF(modelPath);
    const groupRef = useRef();
    const rotationRef = useRef({ x: 0, y: 0 });
    const targetRotationRef = useRef({ x: 0, y: 0 });

    // Smooth rotation towards target
    useFrame(() => {
        if (!groupRef.current) return;
        rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.08;
        rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.08;
        groupRef.current.rotation.x = rotationRef.current.x;
        groupRef.current.rotation.y = rotationRef.current.y;
    });

    return <primitive ref={groupRef} object={scene} />;
}

export default function InteractiveModel({ modelPath = '/models/book.glb' }) {
    const containerRef = useRef();
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const onMouseDown = (e) => {
            isDraggingRef.current = true;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e) => {
            if (!isDraggingRef.current) return;

            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;

            // Store for the Three.js component to read
            containerRef.current._rotation = {
                x: deltaY * 0.005,
                y: deltaX * 0.005,
            };
        };

        const onMouseUp = () => {
            isDraggingRef.current = false;
        };

        const canvas = containerRef.current.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', onMouseDown);
            canvas.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            return () => {
                canvas.removeEventListener('mousedown', onMouseDown);
                canvas.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '580px',
                cursor: 'grab',
                borderRadius: '1rem',
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 2.5], fov: 50 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                style={{ width: '100%', height: '100%' }}
            >
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Model modelPath={modelPath} />
            </Canvas>
        </div>
    );
}
