import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Constants ────────────────────────────────────────────────────────────────

const RADIUS = 1.8;
const CYAN   = "#06B6D4";
const VIOLET = "#8B5CF6";

// ── Utilities ────────────────────────────────────────────────────────────────

/** Convert geographic lat/lon to a 3D point on the sphere surface */
function toSphere(lat, lon, r = RADIUS) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta)
    );
}

// ── Connection arc pairs [lat1, lon1, lat2, lon2, color] ─────────────────────

const ARC_PAIRS = [
    { a: [42.7,  23.3], b: [48.8,   2.3], color: CYAN   }, // Sofia → Paris
    { a: [42.7,  23.3], b: [52.5,  13.4], color: VIOLET }, // Sofia → Berlin
    { a: [42.7,  23.3], b: [51.5,  -0.1], color: CYAN   }, // Sofia → London
    { a: [51.5,  -0.1], b: [40.7, -74.0], color: VIOLET }, // London → NYC
    { a: [48.8,   2.3], b: [40.7, -74.0], color: CYAN   }, // Paris → NYC
    { a: [55.8,  37.6], b: [48.8,   2.3], color: VIOLET }, // Moscow → Paris
    { a: [35.7, 139.7], b: [ 1.3, 103.8], color: CYAN   }, // Tokyo → Singapore
    { a: [22.3, 114.2], b: [35.7, 139.7], color: VIOLET }, // HK → Tokyo
    { a: [-33.9,151.2], b: [ 1.3, 103.8], color: CYAN   }, // Sydney → Singapore
    { a: [19.4, -99.1], b: [40.7, -74.0], color: VIOLET }, // Mexico → NYC
    { a: [42.7,  23.3], b: [35.7, 139.7], color: CYAN   }, // Sofia → Tokyo
    { a: [55.8,  37.6], b: [35.7, 139.7], color: VIOLET }, // Moscow → Tokyo
];

// ── Arc component — a single curved connection line ──────────────────────────

function Arc({ p1, p2, color, opacity = 0.55 }) {
    const geo = useMemo(() => {
        // Midpoint lifted above sphere surface for a curved arc
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const lift = mid.length();
        mid.normalize().multiplyScalar(lift * 1.3);

        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        return new THREE.BufferGeometry().setFromPoints(curve.getPoints(56));
    }, [p1, p2]);

    return (
        <line geometry={geo}>
            <lineBasicMaterial color={color} opacity={opacity} transparent />
        </line>
    );
}

// ── Globe mesh ───────────────────────────────────────────────────────────────

function GlobeGroup() {
    const groupRef = useRef();
    const ringsRef = useRef();

    // Wireframe sphere
    const wireGeo = useMemo(() => {
        const sphere = new THREE.SphereGeometry(RADIUS, 30, 22);
        return new THREE.WireframeGeometry(sphere);
    }, []);

    // Surface dots — Fibonacci spiral for even distribution
    const dotGeo = useMemo(() => {
        const N = 220;
        const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
        const positions = [];
        for (let i = 0; i < N; i++) {
            const theta = (2 * Math.PI * i) / phi;
            const pAngle = Math.acos(1 - (2 * (i + 0.5)) / N);
            const r = RADIUS + 0.015;
            positions.push(
                r * Math.sin(pAngle) * Math.cos(theta),
                r * Math.cos(pAngle),
                r * Math.sin(pAngle) * Math.sin(theta)
            );
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        return geo;
    }, []);

    // Pre-compute arc geometries with real lat/lon positions
    const arcs = useMemo(
        () =>
            ARC_PAIRS.map(({ a, b, color }) => ({
                p1: toSphere(a[0], a[1]),
                p2: toSphere(b[0], b[1]),
                color,
            })),
        []
    );

    // Continuous rotation — globe + independent ring drift
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.07;
            groupRef.current.rotation.x = Math.sin(t * 0.04) * 0.08;
        }
        if (ringsRef.current) {
            // Rings rotate slightly faster than the globe for a detached Saturn feel
            ringsRef.current.rotation.z = t * 0.018;
        }
    });

    return (
        <group ref={groupRef}>
            {/* ── Wireframe sphere ── */}
            <lineSegments geometry={wireGeo}>
                <lineBasicMaterial color={CYAN} opacity={0.11} transparent />
            </lineSegments>

            {/* ── Surface dots ── */}
            <points geometry={dotGeo}>
                <pointsMaterial
                    color={CYAN}
                    size={0.034}
                    opacity={0.78}
                    transparent
                    sizeAttenuation
                />
            </points>

            {/* ── Connection arcs ── */}
            {arcs.map((arc, i) => (
                <Arc key={i} p1={arc.p1} p2={arc.p2} color={arc.color} />
            ))}

            {/* ── Saturn-style rings — tilted group rotates independently ── */}
            <group ref={ringsRef} rotation={[0.42, 0, 0.28]}>
                {/* Inner ring — violet, widest */}
                <mesh>
                    <ringGeometry args={[2.25, 2.62, 128]} />
                    <meshBasicMaterial
                        color={VIOLET}
                        opacity={0.28}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Gap, then mid ring — cyan */}
                <mesh>
                    <ringGeometry args={[2.78, 2.94, 128]} />
                    <meshBasicMaterial
                        color={CYAN}
                        opacity={0.20}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Outer ring — violet, very thin */}
                <mesh>
                    <ringGeometry args={[3.08, 3.16, 128]} />
                    <meshBasicMaterial
                        color={VIOLET}
                        opacity={0.12}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>

            {/* ── Atmosphere glow — large transparent sphere ── */}
            <mesh>
                <sphereGeometry args={[RADIUS * 1.06, 32, 32]} />
                <meshBasicMaterial
                    color={CYAN}
                    opacity={0.04}
                    transparent
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}

// ── Canvas export ─────────────────────────────────────────────────────────────

/**
 * Self-contained Three.js globe. Drop it into any container.
 * Transparent background — inherits page colours.
 */
export default function GlobeScene({ style }) {
    return (
        <Canvas
            camera={{ position: [0, 0.4, 5.8], fov: 42 }}
            style={{ background: "transparent", ...style }}
            gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
            dpr={[1, 1.5]} // cap at 1.5× for performance
        >
            <GlobeGroup />
        </Canvas>
    );
}
