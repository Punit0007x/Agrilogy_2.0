import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWaterTexture, useWoodTexture } from './ProceduralTextures';
import { getTerrainHeight } from '@/utils/terrainUtils';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    // Multi-octave wave displacement for realistic surface chop
    float wz = worldPos.z;
    float wx = worldPos.x;

    float wave1 = sin(wz * 0.18 + uTime * 1.4) * 0.28;
    float wave2 = cos(wx * 0.25 + uTime * 0.9) * 0.18;
    float wave3 = sin(wz * 0.55 + wx * 0.3 + uTime * 2.1) * 0.08;
    float wave4 = cos(wz * 1.1 - uTime * 1.8) * 0.04;   // high freq chop
    float wave5 = sin(wx * 0.8 + wz * 0.4 + uTime * 3.0) * 0.02; // micro ripple

    worldPos.y += wave1 + wave2 + wave3 + wave4 + wave5;

    vWorldPosition = worldPos.xyz;

    // Approximate normal from wave gradients for lighting
    float eps = 0.5;
    float dX = cos(wz * 0.18 + uTime * 1.4) * 0.28 * 0.18 +
               cos(wx * 0.25 + uTime * 0.9) * 0.25 * 0.18;
    float dZ = cos(wz * 0.18 + uTime * 1.4) * 0.18 * 0.18 +
               cos(wz * 0.55 + wx * 0.3 + uTime * 2.1) * 0.55 * 0.08;
    vNormal = normalize(vec3(-dX, 1.0, -dZ));

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  uniform float uTime;
  uniform sampler2D uTexture;

  // Simple hash for caustic patterns
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // ── Base UV coordinates with dual-layer animated flow ──
    vec2 uv1 = vUv * vec2(3.0, 30.0);
    uv1.y -= uTime * 0.18;                        // downstream drift
    uv1.x += sin(vUv.y * 12.0 + uTime * 0.4) * 0.06;  // lateral meandering

    vec2 uv2 = vUv * vec2(2.0, 20.0);
    uv2.y -= uTime * 0.11;
    uv2.x -= sin(vUv.y * 8.0 - uTime * 0.3) * 0.04;

    vec4 tex1 = texture2D(uTexture, uv1);
    vec4 tex2 = texture2D(uTexture, uv2);
    float texBlend = mix(tex1.r, tex2.r, 0.5);

    // ── Depth / edge gradient ──
    float edgeDist = min(vUv.x, 1.0 - vUv.x);      // 0 = bank, 0.5 = centre
    float depth = smoothstep(0.0, 0.4, edgeDist);   // 0 = shallow, 1 = deep

    // ── Realistic water colours (shallow teal → deep navy) ──
    vec3 shallowCol = vec3(0.22, 0.62, 0.70);   // turquoise shallow water
    vec3 midCol     = vec3(0.06, 0.38, 0.58);   // mid-depth blue
    vec3 deepCol    = vec3(0.02, 0.18, 0.38);   // deep-channel navy
    vec3 waterCol   = mix(shallowCol, mix(midCol, deepCol, depth), depth);

    // ── Subsurface scattering tint (light penetrating shallow water) ──
    float sss = (1.0 - depth) * 0.35;
    waterCol += vec3(0.0, 0.18, 0.12) * sss;

    // ── Texture ripple detail overlay ──
    waterCol += texBlend * 0.08 * depth;

    // ── Caustic light patterns (underwater light focuses) ──
    vec2 causticUv = vWorldPosition.xz * 0.12 + vec2(uTime * 0.08, uTime * 0.05);
    float c1 = noise(causticUv);
    float c2 = noise(causticUv * 1.7 + vec2(3.3, 1.7));
    float caustics = pow(c1 * c2, 2.5) * (1.0 - depth) * 1.8;
    waterCol += vec3(0.4, 0.9, 0.8) * caustics * 0.25;

    // ── Fresnel reflectance (edges of view reflect sky more) ──
    vec3 viewDir = normalize(vec3(0.0, 1.0, 0.3));  // approx from above
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.0);
    vec3 skyReflect = vec3(0.50, 0.72, 0.95);       // sky blue reflection
    waterCol = mix(waterCol, skyReflect, fresnel * 0.35);

    // ── Sun specular glint ──
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 halfVec  = normalize(lightDir + viewDir);
    float spec    = pow(max(0.0, dot(vNormal, halfVec)), 180.0);
    // Moving sparkle ripple on top of base specular
    float rippleSpec = pow(max(0.0, sin(vWorldPosition.z * 0.4 + uTime * 2.2) * 0.5 + 0.5), 12.0) * 0.12;
    waterCol += vec3(1.0, 0.97, 0.88) * (spec * 0.6 + rippleSpec);

    // ── Edge foam (white aerated water at banks) ──
    float foamEdge  = smoothstep(0.0, 0.07, edgeDist);
    float foamPulse = sin(vWorldPosition.z * 2.5 + uTime * 3.5) * 0.5 + 0.5;
    float foamNoise = noise(vec2(vWorldPosition.z * 0.4 + uTime, vWorldPosition.x * 0.3));
    float foam      = (1.0 - foamEdge) * foamPulse * foamNoise * 0.9;
    vec3  foamCol   = vec3(0.88, 0.95, 1.00);
    waterCol = mix(waterCol, foamCol, foam);

    // Mid-river foam streaks (turbulence lines)
    float streak = sin(vUv.x * 35.0 + uTime * 0.3) * 0.5 + 0.5;
    streak *= smoothstep(0.3, 0.5, edgeDist) * (1.0 - smoothstep(0.45, 0.5, edgeDist));
    float streakNoise = noise(vec2(vUv.y * 8.0 - uTime * 0.2, vUv.x * 5.0));
    waterCol = mix(waterCol, vec3(0.75, 0.92, 0.98), streak * streakNoise * 0.15);

    // ── Alpha: transparent at banks, opaque in deep channel ──
    float alpha = mix(0.55, 0.94, depth) + fresnel * 0.05;

    gl_FragColor = vec4(waterCol, clamp(alpha, 0.5, 0.96));
  }
`;

export function WaterSystem() {
  const particlesRef = useRef<THREE.Points>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);
  const waterTex = useWaterTexture();
  
  const isMobile = useIsMobile();
  const riverGeometry = useMemo(() => {
    const segments = isMobile ? 12 : 18;
    const geo = new THREE.PlaneGeometry(18, 500, segments, segments * 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const curveOffset = Math.sin(y * 0.05) * 8;
        pos.setX(i, x + curveOffset + 80);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const particleCount = isMobile ? 22 : 40; 
  const particleStats = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const z = Math.random() * 300;
      const x = 80 + Math.sin(z * 0.05) * 8 + (Math.random() - 0.5) * 1.5;
      positions.set([x, 0.5, z], i * 3);
      speeds[i] = 1 + Math.random() * 2.5;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, []);

  useFrame((state, delta) => {
    waterTex.offset.y -= delta * 0.12;
    waterTex.offset.x -= delta * 0.04;

    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (!particlesRef.current) return;
    const pa = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < particleCount; i++) {
      let z = pa.getZ(i) - particleStats.speeds[i] * delta * 4.2;
      if (z < -100) z += 520;
      const x = 80 + Math.sin(z * 0.05) * 8 + Math.cos(z * 0.18 + particleStats.phases[i]) * 0.8;
      const waveY = Math.sin(z * 0.15 + state.clock.elapsedTime * 1.2) * 0.2;
      pa.setXYZ(i, x, 0.4 + waveY, z);
    }
    pa.needsUpdate = true;
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTexture: { value: waterTex }
  }), [waterTex]);

  return (
    <group>
      {/* Deep River Bed */}
      <mesh geometry={riverGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
        <meshStandardMaterial color="#12291a" roughness={0.95} />
      </mesh>
      
      {/* Riverbank transition - soft grass-to-mud blend */}
      <RiverBanks />
      
      {/* Flowing Water Surface */}
      <mesh geometry={riverGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <shaderMaterial 
          ref={shaderMatRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
        />
      </mesh>

      {/* Water Flow Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particleStats.positions, 3]} count={particleCount} />
        </bufferGeometry>
        <pointsMaterial color="#81ecec" size={0.35} transparent opacity={0.5} blending={THREE.AdditiveBlending} sizeAttenuation depthWrite={false} />
      </points>

      {/* Bridges */}
      <WoodenBridge position={[80 + Math.sin(40 * 0.05) * 8, -0.4, 40]} />
      <WoodenBridge position={[80 + Math.sin(120 * 0.05) * 8, -0.4, 120]} />
      <WoodenBridge position={[80 + Math.sin(-40 * 0.05) * 8, -0.4, -40]} />
      <WoodenBridge position={[80 + Math.sin(-120 * 0.05) * 8, -0.4, -120]} />
    </group>
  );
}

// Soft riverbank edges
function RiverBanks() {
  const bankGeo = useMemo(() => {
    // Left bank
    const geo = new THREE.PlaneGeometry(6, 500, 12, 64);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const curveOffset = Math.sin(y * 0.05) * 8;
      pos.setX(i, x + curveOffset + 80 - 10);
      // Slope into river
      const edgeDist = (x + 3) / 6;
      pos.setZ(i, edgeDist * -1.5);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const bankGeoRight = useMemo(() => {
    const geo = new THREE.PlaneGeometry(6, 500, 12, 64);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const curveOffset = Math.sin(y * 0.05) * 8;
      pos.setX(i, x + curveOffset + 80 + 10);
      const edgeDist = 1 - (x + 3) / 6;
      pos.setZ(i, edgeDist * -1.5);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <>
      <mesh geometry={bankGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#3a5020" roughness={0.95} transparent opacity={0.8} />
      </mesh>
      <mesh geometry={bankGeoRight} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#3a5020" roughness={0.95} transparent opacity={0.8} />
      </mesh>
    </>
  );
}

// Wooden plank bridge — properly crosses river from left bank to right bank
// Arched for a more premium, engineering-sound look
function WoodenBridge({ position }: { position: [number, number, number] }) {
  const woodTex = useWoodTexture();
  const [px, py, pz] = position;

  // Recalculate exact river center X at this Z position
  const riverCenterX = 80 + Math.sin(pz * 0.05) * 8;
  
  // River width is ~18 units. Span 32 units to ensure deep landing on both sides.
  const BRIDGE_HALF_SPAN = 16; 
  const PLANK_COUNT = 24;
  const PLANK_SPACING = (BRIDGE_HALF_SPAN * 2) / PLANK_COUNT;

  // ARCH SETTINGS: The bridge is higher in the middle
  const ARCH_HEIGHT = 1.4;
  const getArchY = (x: number) => {
    // Parabolic arch: y = h * (1 - (x/L)^2)
    const normalizedX = x / BRIDGE_HALF_SPAN;
    return ARCH_HEIGHT * (1 - normalizedX * normalizedX);
  };

  const DECK_BASE_Y = 0.5;

  return (
    <group position={[riverCenterX, py, pz]}>
      {/* ── Deck planks running along X ── */}
      {Array.from({ length: PLANK_COUNT }).map((_, i) => {
        const xPos = -BRIDGE_HALF_SPAN + i * PLANK_SPACING + PLANK_SPACING / 2;
        const archY = getArchY(xPos);
        
        // Calculate tangent for plank rotation to follow arch
        const nextX = xPos + 0.1;
        const slope = (getArchY(nextX) - archY) / 0.1;
        const angle = Math.atan(slope);

        return (
          <mesh key={`plank-${i}`} position={[xPos, DECK_BASE_Y + archY, 0]} rotation={[0, 0, angle]} castShadow receiveShadow>
            <boxGeometry args={[PLANK_SPACING - 0.04, 0.15, 4.8]} />
            <meshStandardMaterial map={woodTex} roughness={0.8} color="#8B6340" />
          </mesh>
        );
      })}

      {/* ── Arched longitudinal beams ── */}
      {[-2.1, 2.1].map((zOff) => {
        // We build the beam from small segments to follow the arch
        return (
          <group key={`beam-z-${zOff}`}>
            {Array.from({ length: 12 }).map((_, segment) => {
              const segW = (BRIDGE_HALF_SPAN * 2) / 12;
              const xPos = -BRIDGE_HALF_SPAN + segment * segW + segW/2;
              const archY = getArchY(xPos);
              const nextX = xPos + 0.1;
              const slope = (getArchY(nextX) - archY) / 0.1;
              const angle = Math.atan(slope);

              return (
                <mesh key={segment} position={[xPos, DECK_BASE_Y + archY - 0.15, zOff]} rotation={[0,0,angle]} castShadow>
                  <boxGeometry args={[segW + 0.1, 0.3, 0.35]} />
                  <meshStandardMaterial map={woodTex} color="#5D3A1A" roughness={0.9} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* ── Vertical Railing Posts (anchored to beams) ── */}
      {[-2.2, 2.2].map((zSide) => (
        <group key={`railing-${zSide}`}>
          {Array.from({ length: 11 }).map((_, j) => {
            const xPost = -BRIDGE_HALF_SPAN + j * (BRIDGE_HALF_SPAN * 2 / 10);
            const archY = getArchY(xPost);
            return (
              <mesh key={`post-${j}`} position={[xPost, DECK_BASE_Y + archY + 0.6, zSide]} castShadow>
                <boxGeometry args={[0.18, 1.4, 0.18]} />
                <meshStandardMaterial map={woodTex} roughness={0.9} color="#5D4037" />
              </mesh>
            );
          })}
          
          {/* Top arched handrail (segmented) */}
          {Array.from({ length: 16 }).map((_, seg) => {
            const segW = (BRIDGE_HALF_SPAN * 2) / 16;
            const xPos = -BRIDGE_HALF_SPAN + seg * segW + segW/2;
            const archY = getArchY(xPos);
            const nextX = xPos + 0.1;
            const slope = (getArchY(nextX) - archY) / 0.1;
            const angle = Math.atan(slope);
            
            return (
              <mesh key={`rail-${seg}`} position={[xPos, DECK_BASE_Y + archY + 1.25, zSide]} rotation={[0,0,angle]} castShadow>
                <boxGeometry args={[segW + 0.2, 0.12, 0.18]} />
                <meshStandardMaterial map={woodTex} color="#795548" roughness={0.8} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* ── Main Vertical Supports (Heavy Piles) ── */}
      {/* Placed at banks and middle */}
      {[-10, 0, 10].map((xOff, i) => {
        const archY = getArchY(xOff);
        return (
          <group key={`pile-${i}`} position={[xOff, 0, 0]}>
            {[-1.8, 1.8].map((zOff) => (
              <mesh key={`pile-z-${zOff}`} position={[0, DECK_BASE_Y + archY - 2.5, zOff]} castShadow>
                <cylinderGeometry args={[0.25, 0.3, 5, 8]} />
                <meshStandardMaterial color="#3D2B1F" roughness={0.9} />
              </mesh>
            ))}
            {/* Cross brace between piles */}
            <mesh position={[0, DECK_BASE_Y + archY - 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.15, 4, 0.15]} />
              <meshStandardMaterial color="#3D2B1F" />
            </mesh>
          </group>
        );
      })}

      {/* ── Improved Ground Landings ── */}
      {/* Flat wooden platforms that extend into the dirt paths */}
      {[-1, 1].map((side) => {
        const xPos = side * (BRIDGE_HALF_SPAN + 1.5);
        return (
          <group key={`landing-${side}`} position={[xPos, DECK_BASE_Y - 0.2, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.2, 0.2, 5.2]} />
              <meshStandardMaterial map={woodTex} color="#5D4037" roughness={1} />
            </mesh>
            {/* Transition slope into ground */}
            <mesh position={[side * 2, -0.1, 0]} rotation={[0, 0, side * 0.15]}>
              <boxGeometry args={[1.5, 0.15, 5.2]} />
              <meshStandardMaterial map={woodTex} color="#4E342E" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}



// Pond component
function Pond({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const waterTex = useWaterTexture();
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pond basin */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial color="#1a3d2e" roughness={0.95} />
      </mesh>
      
      {/* Water surface */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 32]} />
        <meshStandardMaterial 
          color="#2a6e8c" 
          transparent 
          opacity={0.75}
          roughness={0.2}
        />
      </mesh>
      
      {/* Rocks around pond */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 5.5 + Math.random() * 1.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const rockSize = 0.3 + Math.random() * 0.5;
        return (
          <mesh key={`rock-${i}`} position={[x, 0.1, z]}>
            <sphereGeometry args={[rockSize, 5, 4]} />
            <meshStandardMaterial color="#5a5a5a" roughness={1} />
          </mesh>
        );
      })}
      
      {/* Reeds/plants around pond */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + 0.5;
        const radius = 6 + Math.random() * 0.5;
        return (
          <group key={`reed-${i}`} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <mesh position={[0, 0.8, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.04, 1.6, 4]} />
              <meshStandardMaterial color="#4a6a2a" roughness={0.9} />
            </mesh>
            <mesh position={[0.1, 1.2, 0]}>
              <sphereGeometry args={[0.15, 4, 4]} />
              <meshStandardMaterial color="#5a7a3a" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Village Ponds
export function VillagePonds() {
  const pondPositions: [number, number][] = [
    [-75, 25],
    [95, -45],
    [-85, 80],
    [105, 65],
    [-70, -60],
    [80, 160],
  ];
  
  return (
    <group>
      {pondPositions.map((pos, i) => {
        const height = getTerrainHeight(pos[0], pos[1]);
        return <Pond key={`pond-${i}`} position={[pos[0], height, pos[1]]} scale={1.2} />
      })}
    </group>
  );
}
