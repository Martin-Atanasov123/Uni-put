import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Constants ────────────────────────────────────────────────────────────────

const R      = 2.0;
const CYAN   = "#06B6D4";
const VIOLET = "#8B5CF6";
const ADD    = THREE.AdditiveBlending;

// ── Helpers ──────────────────────────────────────────────────────────────────

function geo3(lat, lon, r = R) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta),
    );
}

// ── Lat / Lon wireframe grid ──────────────────────────────────────────────────
// Looks like a holographic globe with latitude rings and meridian lines

function Grid() {
    const bufGeo = useMemo(() => {
        const pos  = [];
        const SEGS = 100;

        // Latitude parallels
        for (let i = 1; i < 13; i++) {
            const phi = (i / 13) * Math.PI;
            const y   = Math.cos(phi) * R;
            const r   = Math.sin(phi) * R;
            for (let j = 0; j < SEGS; j++) {
                const a0 = (j / SEGS) * Math.PI * 2;
                const a1 = ((j + 1) / SEGS) * Math.PI * 2;
                pos.push(r * Math.cos(a0), y, r * Math.sin(a0));
                pos.push(r * Math.cos(a1), y, r * Math.sin(a1));
            }
        }

        // Longitude meridians
        for (let i = 0; i < 20; i++) {
            const th = (i / 20) * Math.PI * 2;
            for (let j = 0; j < SEGS; j++) {
                const p0 = (j / SEGS) * Math.PI;
                const p1 = ((j + 1) / SEGS) * Math.PI;
                pos.push(R * Math.sin(p0) * Math.cos(th), R * Math.cos(p0), R * Math.sin(p0) * Math.sin(th));
                pos.push(R * Math.sin(p1) * Math.cos(th), R * Math.cos(p1), R * Math.sin(p1) * Math.sin(th));
            }
        }

        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        return g;
    }, []);

    return (
        <lineSegments geometry={bufGeo}>
            <lineBasicMaterial color={CYAN} opacity={0.10} transparent blending={ADD} depthWrite={false} />
        </lineSegments>
    );
}

// ── Equator highlight — slightly brighter ring at 0° latitude ────────────────

function Equator() {
    const geo = useMemo(() => {
        const pos  = [];
        const SEGS = 128;
        for (let j = 0; j < SEGS; j++) {
            const a0 = (j / SEGS) * Math.PI * 2;
            const a1 = ((j + 1) / SEGS) * Math.PI * 2;
            pos.push(R * Math.cos(a0), 0, R * Math.sin(a0));
            pos.push(R * Math.cos(a1), 0, R * Math.sin(a1));
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        return g;
    }, []);

    return (
        <lineSegments geometry={geo}>
            <lineBasicMaterial color={CYAN} opacity={0.28} transparent blending={ADD} depthWrite={false} />
        </lineSegments>
    );
}

// ── Surface dots — Fibonacci spiral for even distribution ────────────────────

function Dots({ count = 400 }) {
    const geo = useMemo(() => {
        const PHI = (1 + Math.sqrt(5)) / 2;
        const pos = [];
        for (let i = 0; i < count; i++) {
            const theta  = (2 * Math.PI * i) / PHI;
            const pAngle = Math.acos(1 - (2 * (i + 0.5)) / count);
            const r      = R + 0.018;
            pos.push(
                r * Math.sin(pAngle) * Math.cos(theta),
                r * Math.cos(pAngle),
                r * Math.sin(pAngle) * Math.sin(theta),
            );
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        return g;
    }, [count]);

    return (
        <points geometry={geo}>
            <pointsMaterial
                color={CYAN}
                size={0.026}
                opacity={0.85}
                transparent
                sizeAttenuation
                blending={ADD}
                depthWrite={false}
            />
        </points>
    );
}

// ── City hotspot — glowing bright dot at a specific lat/lon ──────────────────

function Hotspot({ lat, lon, color = CYAN, size = 0.055 }) {
    const pos = useMemo(() => geo3(lat, lon, R + 0.04), [lat, lon]);
    return (
        <mesh position={pos}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshBasicMaterial color={color} blending={ADD} depthWrite={false} />
        </mesh>
    );
}

// ── Static arc line ───────────────────────────────────────────────────────────

function ArcLine({ p1, p2, color, opacity = 0.28 }) {
    const geo = useMemo(() => {
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(mid.length() * 1.42);
        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        return new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    }, [p1, p2]);

    return (
        <line geometry={geo}>
            <lineBasicMaterial color={color} opacity={opacity} transparent blending={ADD} depthWrite={false} />
        </line>
    );
}

// ── Animated particle that travels along an arc ───────────────────────────────

function FlowParticle({ p1, p2, color, speed, delay }) {
    const ref   = useRef();
    const curve = useMemo(() => {
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(mid.length() * 1.42);
        return new THREE.QuadraticBezierCurve3(p1, mid, p2);
    }, [p1, p2]);

    useFrame(({ clock }) => {
        const t   = ((clock.elapsedTime * speed + delay) % 1);
        const pos = curve.getPoint(t);
        if (ref.current) ref.current.position.copy(pos);
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.038, 6, 6]} />
            <meshBasicMaterial color={color} blending={ADD} depthWrite={false} />
        </mesh>
    );
}

// ── Atmosphere — multi-layer glow ─────────────────────────────────────────────

function Atmosphere() {
    return (
        <>
            {/* Outermost halo */}
            <mesh>
                <sphereGeometry args={[R * 1.22, 32, 32]} />
                <meshBasicMaterial color={CYAN} opacity={0.018} transparent side={THREE.BackSide} blending={ADD} depthWrite={false} />
            </mesh>
            {/* Mid glow */}
            <mesh>
                <sphereGeometry args={[R * 1.10, 32, 32]} />
                <meshBasicMaterial color={CYAN} opacity={0.045} transparent side={THREE.BackSide} blending={ADD} depthWrite={false} />
            </mesh>
            {/* Inner atmosphere — slightly violet tint */}
            <mesh>
                <sphereGeometry args={[R * 1.04, 32, 32]} />
                <meshBasicMaterial color={VIOLET} opacity={0.022} transparent side={THREE.BackSide} blending={ADD} depthWrite={false} />
            </mesh>
        </>
    );
}

// ── Arc + flow data (city pairs) ──────────────────────────────────────────────

const CITIES = {
    sofia:     [42.7,  23.3],
    paris:     [48.8,   2.3],
    london:    [51.5,  -0.1],
    berlin:    [52.5,  13.4],
    nyc:       [40.7, -74.0],
    moscow:    [55.8,  37.6],
    tokyo:     [35.7, 139.7],
    singapore: [ 1.3, 103.8],
    sydney:    [-33.9, 151.2],
    dubai:     [25.2,  55.3],
    beijing:   [39.9, 116.4],
    mumbai:    [19.1,  72.9],
};

const ARC_DATA = [
    { a: "sofia",     b: "paris",     color: CYAN,   speed: 0.20, delay: 0.00 },
    { a: "sofia",     b: "london",    color: VIOLET, speed: 0.17, delay: 0.25 },
    { a: "sofia",     b: "berlin",    color: CYAN,   speed: 0.22, delay: 0.50 },
    { a: "sofia",     b: "nyc",       color: VIOLET, speed: 0.13, delay: 0.10 },
    { a: "paris",     b: "moscow",    color: CYAN,   speed: 0.18, delay: 0.70 },
    { a: "london",    b: "nyc",       color: VIOLET, speed: 0.15, delay: 0.40 },
    { a: "tokyo",     b: "singapore", color: CYAN,   speed: 0.21, delay: 0.30 },
    { a: "tokyo",     b: "beijing",   color: VIOLET, speed: 0.24, delay: 0.60 },
    { a: "singapore", b: "sydney",    color: CYAN,   speed: 0.16, delay: 0.85 },
    { a: "dubai",     b: "mumbai",    color: VIOLET, speed: 0.19, delay: 0.55 },
    { a: "sofia",     b: "tokyo",     color: CYAN,   speed: 0.10, delay: 0.80 },
    { a: "nyc",       b: "london",    color: VIOLET, speed: 0.14, delay: 0.20 },
];

// ── Main rotating globe ───────────────────────────────────────────────────────

function GlobeGroup() {
    const groupRef = useRef();

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.055;
            groupRef.current.rotation.x = Math.sin(t * 0.025) * 0.06;
        }
    });

    // Pre-compute 3D positions for each city
    const cityPos = useMemo(() => {
        const map = {};
        for (const [key, [lat, lon]] of Object.entries(CITIES)) {
            map[key] = geo3(lat, lon);
        }
        return map;
    }, []);

    return (
        <group ref={groupRef}>
            <Grid />
            <Equator />
            <Dots />
            <Atmosphere />

            {/* City hotspots */}
            {Object.entries(CITIES).map(([key, [lat, lon]]) => (
                <Hotspot
                    key={key}
                    lat={lat}
                    lon={lon}
                    color={["sofia", "paris", "london", "berlin"].includes(key) ? CYAN : VIOLET}
                    size={key === "sofia" ? 0.065 : 0.045}
                />
            ))}

            {/* Connection arcs + flowing particles */}
            {ARC_DATA.map(({ a, b, color, speed, delay }, i) => {
                const p1 = cityPos[a];
                const p2 = cityPos[b];
                return (
                    <group key={i}>
                        <ArcLine p1={p1} p2={p2} color={color} />
                        <FlowParticle p1={p1} p2={p2} color={color} speed={speed} delay={delay} />
                    </group>
                );
            })}
        </group>
    );
}

// ── Canvas export ─────────────────────────────────────────────────────────────

/**
 * Holographic Earth globe — pure Three.js, zero external assets.
 * Loads in <50ms (all procedural geometry, no files to fetch).
 * Features: lat/lon grid, surface dots, city hotspots,
 *           animated flow particles along connection arcs, atmosphere glow.
 */
export default function HolographicEarth({ style }) {
    return (
        <Canvas
            camera={{ position: [0, 0.6, 6.2], fov: 38 }}
            style={{ background: "transparent", ...style }}
            gl={{
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
            }}
            dpr={[1, 1.5]}
        >
            <GlobeGroup />
        </Canvas>
    );
}
