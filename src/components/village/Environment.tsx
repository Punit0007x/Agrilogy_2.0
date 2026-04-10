import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVillageStore } from '@/store/villageStore';
import { Sky as DreiSky, Cloud, Clouds } from '@react-three/drei';
import { useIsMobile } from '@/hooks/use-mobile';
import { getTerrainHeight } from '@/utils/terrainUtils';

const dummy = new THREE.Object3D();

// ==========================================================
// CINEMATIC CYCLE - Smooth light transitions
// ==========================================================
export function AutoDayNightCycle() {
  useFrame((_, delta) => {
    const s = useVillageStore.getState();
    // Faster day/night cycle for a more cinematic feel
    let newTime = s.timeOfDay + delta * 0.0024;
    if (newTime >= 1) newTime -= 1;
    s.setTimeOfDay(newTime);
  });
  return null;
}

// Pre-allocate Color objects outside render loop to avoid GC pressure
const _nightColor = new THREE.Color();
const _nightAmbient = new THREE.Color('#4870a0');
const _dayAmbient = new THREE.Color('#a89070');

function computeNightFactor(timeOfDay: number) {
  const angle = (timeOfDay * 2 - 0.5) * Math.PI;
  const sunY = Math.sin(angle);
  const twilightStart = 0.14;
  const nightStart = -0.16;
  return THREE.MathUtils.clamp((twilightStart - sunY) / (twilightStart - nightStart), 0, 1);
}

export function Lighting() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  useFrame(() => {
    if (!dirRef.current || !ambRef.current || !hemiRef.current) return;
    const timeOfDay = useVillageStore.getState().timeOfDay;
    const angle = (timeOfDay * 2 - 0.5) * Math.PI;
    dirRef.current.position.set(Math.cos(angle) * 150, Math.sin(angle) * 120, 80);

    const warmth = 1 - Math.abs(timeOfDay - 0.5) * 2;
    const isSunrise = timeOfDay >= 0.22 && timeOfDay <= 0.32;
    const isSunset = timeOfDay >= 0.68 && timeOfDay <= 0.78;

    if (Math.sin(angle) > 0) {
      if (isSunrise || isSunset) {
        dirRef.current.color.setRGB(1, 0.55, 0.35);
      } else {
        dirRef.current.color.setRGB(1, 0.8 + warmth * 0.2, 0.6 + warmth * 0.4);
      }
    } else {
      dirRef.current.color.set('#d4e8ff');
    }

    const sunIntensity = Math.max(0, Math.sin(angle));
    const moonGlow = Math.max(0, -Math.sin(angle));
    dirRef.current.intensity = sunIntensity * 2.4 + 0.42 + moonGlow * 0.18;

    const nightFactor = computeNightFactor(timeOfDay);
    ambRef.current.intensity = THREE.MathUtils.lerp(0.75, 0.50, nightFactor);
    ambRef.current.color.copy(_dayAmbient).lerp(_nightAmbient, THREE.MathUtils.clamp(nightFactor * 0.95, 0, 1));

    hemiRef.current.color.set('#9bb8da');
    hemiRef.current.groundColor.set('#2b4d6d');
    hemiRef.current.intensity = THREE.MathUtils.lerp(0.55, 0.34, nightFactor);
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.25} color={_dayAmbient} />
      <directionalLight
        ref={dirRef}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={250}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={80}
        shadow-bias={-0.0003}
      />
      <hemisphereLight ref={hemiRef} args={['#aaccff', '#3d5229', 0.4]} />
      <VillageNightGlow />
    </>
  );
}

function VillageNightGlow() {
  const farmers = useVillageStore((s) => s.farmers);
  const positions = useMemo(() => {
    return Object.values(farmers).map((farmer) => [
      farmer.position[0],
      getTerrainHeight(farmer.position[0], farmer.position[2]) + 2.4,
      farmer.position[2],
    ] as [number, number, number]);
  }, [farmers]);

  const lightRefs = useRef<THREE.PointLight[]>([]);

  useFrame(() => {
    const nightFactor = computeNightFactor(useVillageStore.getState().timeOfDay);
    lightRefs.current.forEach((light) => {
      if (light) light.intensity = nightFactor * 1.2;
    });
  });

  return (
    <group>
      {positions.map((pos, index) => (
        <pointLight
          key={index}
          ref={(ref) => {
            if (ref) lightRefs.current[index] = ref;
          }}
          position={pos}
          color="#ffd9a3"
          intensity={0}
          distance={18}
          decay={2}
          castShadow={false}
        />
      ))}
    </group>
  );
}

// ==========================================================
// PREMIUM SKY SYSTEM
// ==========================================================
export function Sky() {
  const isMobile = useIsMobile();
  const skyRef = useRef<THREE.Group>(null);
  const sunMeshRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Group>(null);
  const skyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const orbitX = 250;
  const orbitY = 160;
  const backdropZ = -200;

  const keyframes = [
    { t: 0.00, color: '#05061a' }, // Deep night
    { t: 0.16, color: '#121f4f' },
    { t: 0.24, color: '#ff9f4f' }, // Sunrise blush
    { t: 0.28, color: '#ffcb7a' },
    { t: 0.32, color: '#81c7f4' }, // Bright day
    { t: 0.60, color: '#81c7f4' },
    { t: 0.68, color: '#ffb250' }, // Golden hour
    { t: 0.72, color: '#ff6d56' },
    { t: 0.76, color: '#b14fd8' }, // Sunset purple
    { t: 0.80, color: '#141339' },
    { t: 1.00, color: '#05061a' },
  ];


  const sunTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grd = ctx.createRadialGradient(256, 256, 15, 256, 256, 256);
    grd.addColorStop(0, 'rgba(255, 255, 250, 1)');
    grd.addColorStop(0.1, 'rgba(255, 250, 200, 0.9)');
    grd.addColorStop(0.4, 'rgba(255, 180, 80, 0.4)');
    grd.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const moonTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Moon glow
    const glow = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
    glow.addColorStop(0, 'rgba(210, 230, 255, 0.3)');
    glow.addColorStop(1, 'rgba(210, 230, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 512);

    // Moon disc
    ctx.beginPath();
    ctx.arc(256, 256, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#f8faff';
    ctx.fill();

    // High detail Lunar Maria
    ctx.fillStyle = 'rgba(80, 90, 130, 0.25)';
    const patches = [
      [235, 245, 18], [275, 225, 14], [255, 275, 22], 
      [235, 270, 12], [245, 230, 8], [270, 255, 10]
    ];
    patches.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame(() => {
    const timeOfDay = useVillageStore.getState().timeOfDay;
    const angle = (timeOfDay * 2 - 0.5) * Math.PI;
    const sunX = Math.cos(angle) * orbitX;
    const sunY = Math.sin(angle) * orbitY;
    const moonAngle = angle + Math.PI;
    const moonX = Math.cos(moonAngle) * orbitX;
    const moonY = Math.sin(moonAngle) * orbitY;

    if (sunMeshRef.current) {
      sunMeshRef.current.position.set(sunX, sunY, backdropZ + 20);
      sunMeshRef.current.visible = sunY > -30;
    }
    if (moonMeshRef.current) {
      moonMeshRef.current.position.set(moonX, moonY, backdropZ + 20);
      moonMeshRef.current.visible = moonY > -30 && (timeOfDay < 0.35 || timeOfDay > 0.65);
    }
    if (skyMatRef.current) {
      let colorFound = false;
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (timeOfDay >= keyframes[i].t && timeOfDay <= keyframes[i+1].t) {
          const factor = (timeOfDay - keyframes[i].t) / (keyframes[i+1].t - keyframes[i].t);
          _nightColor.set(keyframes[i].color).lerp(new THREE.Color(keyframes[i+1].color), factor);
          skyMatRef.current.color.copy(_nightColor);
          colorFound = true;
          break;
        }
      }
    }
  });

  return (
    <group ref={skyRef}>
      {/* Background Dome */}
      <mesh>
        <sphereGeometry args={[400, 32, 32]} />
        <meshBasicMaterial ref={skyMatRef} side={THREE.BackSide} />
      </mesh>

      <DreiSky 
        sunPosition={[0, 10, -200]} // This is updated separately by drcisy if needed, but we used manual sun/moon
        turbidity={6} 
        rayleigh={2} 
        mieCoefficient={0.004} 
        mieDirectionalG={0.8} 
      />

      {/* SUN */}
      <group ref={sunMeshRef}>
        <mesh>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial map={sunTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </mesh>
      </group>

      {/* MOON */}
      <group ref={moonMeshRef}>
        <mesh>
          <planeGeometry args={[140, 140]} />
          <meshBasicMaterial map={moonTex} transparent depthWrite={false} fog={false} />
        </mesh>
      </group>

      <TwinklingStars />
      <MeteorShower />
      <Fireflies />
      <RainSystem />
    </group>
  );
}

// ==========================================================
// TWINKLING STARS - Dense, colorful and widespread
// ==========================================================
function TwinklingStars() {
  const isMobile = useIsMobile();
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  const { positions, sizes, phases, colors } = useMemo(() => {
    const count = isMobile ? 50 : 140; // lighter on mobile
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    const ph = new Float32Array(count);
    const c = new Float32Array(count * 3); // RGB colors
    
    for (let i = 0; i < count; i++) {
      // Stratified distribution for better coverage
      const r = 380 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
      
      // Keep most stars above horizon, but some near it for depth
      if (p[i*3+1] < -50) p[i*3+1] *= -1; 

      s[i] = 3.0 + Math.random() * 8.0; // EVEN BIGGER
      ph[i] = Math.random() * 1000; 

      // Spectral colors: white, blueish, reddish, yellowish
      const type = Math.random();
      if (type < 0.6) { // White
        c[i*3] = 1.0; c[i*3+1] = 1.0; c[i*3+2] = 1.0;
      } else if (type < 0.8) { // Blueish (Vega/Sirius)
        c[i*3] = 0.85; c[i*3+1] = 0.95; c[i*3+2] = 1.0;
      } else if (type < 0.9) { // Reddish (Antares)
        c[i*3] = 1.0; c[i*3+1] = 0.8; c[i*3+2] = 0.7;
      } else { // Yellowish (Rigel)
        c[i*3] = 1.0; c[i*3+1] = 1.0; c[i*3+2] = 0.9;
      }
    }
    return { positions: p, sizes: s, phases: ph, colors: c };
  }, []);

  useFrame((state) => {
    if (isMobile || !shaderRef.current) return; // DISABLE shader animation on mobile
    const timeOfDay = useVillageStore.getState().timeOfDay;
    shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    
    // Smooth fade logic
    const sunAngle = (timeOfDay * 2 - 0.5) * Math.PI;
    const sunY = Math.sin(sunAngle);
    let targetOpacity = 0;
    
    if (sunY < -0.15) targetOpacity = 1.0;
    else if (sunY < 0.05) targetOpacity = Math.max(0, (0.05 - sunY) / 0.2);
    
    shaderRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      shaderRef.current.uniforms.uOpacity.value, 
      targetOpacity, 
      0.02
    );
  });

  if (isMobile) {
    // Simple points on mobile
    return (
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} count={colors.length / 3} />
        </bufferGeometry>
        <pointsMaterial size={2} vertexColors transparent opacity={0.8} />
      </points>
    );
  }

  // Desktop version with shader
  const starShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      attribute vec3 color;
      varying float vPhase;
      varying vec3 vColor;
      void main() {
        vPhase = phase;
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (1500.0 / length(mvPosition.xyz)); // Even more visibility
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      varying float vPhase;
      varying vec3 vColor;
      void main() {
        // Simplified twinkling for better performance
        float twinkle = 0.5 + 0.5 * sin(uTime * 1.5 + vPhase);
        
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;
        
        float strength = 1.0 - (dist * 2.0);
        gl_FragColor = vec4(vColor, strength * uOpacity * twinkle);
      }
    `,
  }), []);

  return (
    <points frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} count={sizes.length} />
        <bufferAttribute attach="attributes-phase" args={[phases, 1]} count={phases.length} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={colors.length / 3} />
      </bufferGeometry>
      <shaderMaterial 
        ref={shaderRef} 
        args={[starShader]} 
        transparent 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
}

// ==========================================================
// MOVING CLOUDS - Widespread, high-fidelity linear drift
// ==========================================================
function MovingClouds() {
  
  // Use a larger array of cloud positions to ensure widespread coverage
  const cloudGroups = useMemo(() => {
    return [
      { id: 1, pos: [0, 85, 0] as [number, number, number], seed: 10, scale: 1.2, speed: 0.8 },
      { id: 2, pos: [200, 75, 150] as [number, number, number], seed: 20, scale: 0.9, speed: 0.6 },
      { id: 3, pos: [-180, 95, -120] as [number, number, number], seed: 30, scale: 1.1, speed: 0.7 },
      { id: 4, pos: [-250, 80, 200] as [number, number, number], seed: 40, scale: 0.8, speed: 0.9 },
      { id: 5, pos: [150, 90, -250] as [number, number, number], seed: 50, scale: 1.3, speed: 0.5 },
      { id: 6, pos: [-50, 100, 300] as [number, number, number], seed: 60, scale: 1.0, speed: 0.75 },
    ];
  }, []);

  // Calculate smooth clearance at night
  const cloudOpacity = 0.8;
  // Note: cloudOpacity should ideally be updated in useFrame to avoid re-renders
  // But since we use SingleCloud which has its own useFrame, we can pass it as a prop or update via ref

  return (
    <group>
      {cloudGroups.map((group) => (
        <SingleCloud 
          key={group.id} 
          initialPos={group.pos} 
          seed={group.seed} 
          scale={group.scale} 
          speed={group.speed}
          opacity={cloudOpacity} 
        />
      ))}
    </group>
  );
}

interface SingleCloudProps {
  initialPos: [number, number, number];
  seed: number;
  scale: number;
  speed: number;
  opacity: number;
}

function SingleCloud({ initialPos, seed, scale, speed, opacity }: SingleCloudProps) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    const timeOfDay = useVillageStore.getState().timeOfDay;
    const sunAngle = (timeOfDay * 2 - 0.5) * Math.PI;
    const sunY = Math.sin(sunAngle);

    let currentOpacity = opacity;
    if (sunY < -0.1) currentOpacity = Math.max(0, opacity * (1 - (sunY + 0.1) / -0.2));
    if (sunY < -0.3) currentOpacity = 0;

    const cloudMesh = ref.current.children[0] as THREE.Mesh;
    const cloudMat = cloudMesh.material as THREE.MeshBasicMaterial;
    if (cloudMat) cloudMat.opacity = currentOpacity;

    const t = state.clock.elapsedTime * speed;
    
    // Smooth linear drift with wide wraparound
    const worldSize = 800;
    const x = ((initialPos[0] + t * 5 + worldSize/2) % worldSize) - worldSize/2;
    const z = ((initialPos[2] + t * 2 + worldSize/2) % worldSize) - worldSize/2;
    
    ref.current.position.set(x, initialPos[1], z);
    ref.current.rotation.y = t * 0.05; // Very slow organic rotation
  });

  return (
    <group ref={ref}>
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud 
          segments={12}
          bounds={[50 * scale, 15 * scale, 50 * scale]} 
          volume={35 * scale} 
          color="#ffffff" 
          opacity={opacity} 
          seed={seed} 
        />
      </Clouds>
    </group>
  );
}

// ==========================================================
// METEOR SHOWER - Efficient shooting stars
// ==========================================================
function MeteorShower() {
  const isMobile = useIsMobile();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = isMobile ? 1 : 3; // simpler on mobile
  
  const meteors = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0,
      size: 0
    }));
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const timeOfDay = useVillageStore.getState().timeOfDay;
    
    const isNight = timeOfDay < 0.3 || timeOfDay > 0.7;
    if (!isNight) {
      if (meshRef.current.visible) meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    meteors.forEach((m, i) => {
      if (!m.active) {
        // Randomly spawn a meteor
        if (Math.random() < 0.003) {
          m.active = true;
          m.life = 0;
          m.maxLife = 0.5 + Math.random() * 0.8;
          m.size = 0.2 + Math.random() * 0.4;
          
          m.pos.set(
            (Math.random() - 0.5) * 400,
            150 + Math.random() * 100,
            -150 + (Math.random() - 0.5) * 200
          );
          
          m.vel.set(
            (Math.random() - 0.5) * 200,
            -50 - Math.random() * 50,
            (Math.random() - 0.5) * 100
          );
        }
        dummy.scale.set(0, 0, 0);
      } else {
        m.life += delta;
        m.pos.add(m.vel.clone().multiplyScalar(delta));
        
        const alpha = 1.0 - (m.life / m.maxLife);
        if (alpha <= 0) {
          m.active = false;
          dummy.scale.set(0, 0, 0);
        } else {
          dummy.position.copy(m.pos);
          const s = m.size * alpha;
          dummy.scale.set(s, s, s * 15); // Stretched for motion blur look
          dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), m.vel.clone().normalize());
        }
      }
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}


// ==========================================================
// FIREFLIES 
// ==========================================================
function Fireflies() {
  const isMobile = useIsMobile();
  const ref = useRef<THREE.Points>(null);
  const count = isMobile ? 8 : 30;

  const { positions, speeds } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 140;
      p[i * 3 + 1] = 0.5 + Math.random() * 6;
      p[i * 3 + 2] = (Math.random() - 0.5) * 140;
      s[i] = 0.2 + Math.random() * 0.4;
    }
    return { positions: p, speeds: s };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const timeOfDay = useVillageStore.getState().timeOfDay;
    const pa = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    
    const sunAngle = (timeOfDay * 2 - 0.5) * Math.PI;
    const sunY = Math.sin(sunAngle);
    const visibility = sunY < -0.1 ? 1 : sunY < 0.1 ? (0.1 - sunY) / 0.2 : 0;
    
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, visibility * 0.7, 0.04);

    if (mat.opacity <= 0.01) return;

    for (let i = 0; i < count; i++) {
      pa.setY(i, positions[i * 3 + 1] + Math.sin(t * speeds[i] * 2) * 0.4);
      pa.setX(i, positions[i * 3] + Math.cos(t * speeds[i] * 1.5) * 1.5);
    }
    pa.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} /></bufferGeometry>
      <pointsMaterial color="#d4ff00" size={0.25} transparent opacity={0} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ==========================================================
// REALISTIC RAIN - High volume streaks and ground splashes
// ==========================================================
function RainSystem() {
  const isMobile = useIsMobile();
  const isRaining = useVillageStore((s) => s.isRaining);
  const rainRef = useRef<THREE.Points>(null);
  const splashRef = useRef<THREE.Points>(null);
  const intensityRef = useRef(0);
  
  const count = isMobile ? 0 : 900; // DISABLED on mobile for performance
  const splashCount = isMobile ? 0 : 120;

  const rainTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grd = ctx.createLinearGradient(16, 0, 16, 128);
    grd.addColorStop(0, 'rgba(200, 220, 255, 0)');
    grd.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
    grd.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(14, 0, 4, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const splashTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const { rainPos, splashPos, rainVel } = useMemo(() => {
    const rp = new Float32Array(count * 3);
    const rv = new Float32Array(count);
    const sp = new Float32Array(splashCount * 3);
    for (let i = 0; i < count; i++) {
        rp[i * 3] = (Math.random() - 0.5) * 300;
        rp[i * 3 + 1] = Math.random() * 100;
        rp[i * 3 + 2] = (Math.random() - 0.5) * 300;
        rv[i] = 120 + Math.random() * 60;
    }
    for (let i = 0; i < splashCount; i++) {
        sp[i * 3] = (Math.random() - 0.5) * 300;
        sp[i * 3 + 1] = 0.1;
        sp[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }
    return { rainPos: rp, splashPos: sp, rainVel: rv };
  }, []);

  useFrame((state, delta) => {
    const target = isRaining ? 1 : 0;
    intensityRef.current = THREE.MathUtils.lerp(intensityRef.current, target, 0.02);

    // Skip ALL work when not raining (was previously iterating 12000 particles every frame)
    if (intensityRef.current < 0.001) {
      if (rainRef.current) (rainRef.current.material as THREE.PointsMaterial).opacity = 0;
      if (splashRef.current) (splashRef.current.material as THREE.PointsMaterial).opacity = 0;
      return;
    }

    if (rainRef.current) {
        const pa = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const mat = rainRef.current.material as THREE.PointsMaterial;
        mat.opacity = 0.35 * intensityRef.current;
        for (let i = 0; i < count; i++) {
            let y = pa.getY(i) - rainVel[i] * delta;
            if (y < 0) y += 90;
            pa.setY(i, y);
            pa.setX(i, pa.getX(i) + delta * 3); 
        }
        pa.needsUpdate = true;
    }

    if (splashRef.current) {
        const pa = splashRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const mat = splashRef.current.material as THREE.PointsMaterial;
        mat.opacity = 0.25 * intensityRef.current;
        const time = state.clock.elapsedTime;
        for (let i = 0; i < splashCount; i++) {
            const p = (time * 10 + i) % 10 / 10;
            if (p < 0.1) {
                 pa.setX(i, (Math.random() - 0.5) * 300);
                 pa.setZ(i, (Math.random() - 0.5) * 300);
            }
        }
        pa.needsUpdate = true;
        mat.size = (0.5 + Math.sin(time * 15) * 0.2) * intensityRef.current;
    }
  });

  return (
    <group>
      <points ref={rainRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[rainPos, 3]} count={count} /></bufferGeometry>
        <pointsMaterial map={rainTex} size={5} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points ref={splashRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[splashPos, 3]} count={splashCount} /></bufferGeometry>
        <pointsMaterial map={splashTex} size={0.6} sizeAttenuation transparent opacity={0} depthWrite={false} />
      </points>
    </group>
  );
}
