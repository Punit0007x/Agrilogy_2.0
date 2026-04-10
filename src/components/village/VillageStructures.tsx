import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVillageStore, type VillageFarmer } from '@/store/villageStore';
import { useWallTexture, useRoofTexture, useSoilTexture, useStoneTexture, useWoodTexture, useWaterTexture, useCropTexture, useDirtTexture } from './ProceduralTextures';
import { getTerrainHeight } from '@/utils/terrainUtils';
import { wildScenery } from '@/data/wildScenery';
import { IoTStation, ScrutinyCamera } from '@/components/village/IoTDevices';
import { useIsMobile } from '@/hooks/use-mobile';

const smokeDummy = new THREE.Object3D();

// Pre-allocate color objects to avoid per-frame garbage collection
const _tempColor = new THREE.Color();
const _dayColor = new THREE.Color('#87CEEB');
const _nightGlowColor = new THREE.Color('#ffcc55');
const _emissiveDark = new THREE.Color('#000000');
const _emissiveGlow = new THREE.Color('#ff9922');
const _bulbOff = new THREE.Color('#666666');
const _bulbOn = new THREE.Color('#ffeab3');

// Terrain height cache for performance
const terrainCache = new Map<string, number>();
const CACHE_GRID_SIZE = 2; // 2 unit grid

function getCachedTerrainHeight(x: number, z: number): number {
  const key = `${Math.floor(x / CACHE_GRID_SIZE)},${Math.floor(z / CACHE_GRID_SIZE)}`;
  if (terrainCache.has(key)) {
    return terrainCache.get(key)!;
  }
  const height = getTerrainHeight(x, z);
  terrainCache.set(key, height);
  return height;
}

// Crop colors for differentiation
const CROP_COLORS = [
  '#2d8c2e', // Dark green — Rice / Sugarcane
  '#7ab648', // Bright green — Wheat / Maize
  '#c4a820', // Golden — Mustard
  '#8b6914', // Brown — Potato / Groundnut
  '#3da86b', // Teal green — Turmeric
  '#6b9e30', // Lime — Soybean
  '#d4a030', // Amber — Millet
  '#4e9e4e', // Medium green — Cotton
  '#a0c040', // Yellow-green — Vegetables
  '#5c8c3e', // Forest green — Paddy
];

// ============================================================
//  KACHHA ROAD
// ============================================================

function VillageRoads() {
  const farmers = useVillageStore((s) => s.farmers);
  const farmerOrder = useVillageStore((s) => s.farmerOrder);
  const dirtTex = useDirtTexture();
  const isMobile = useIsMobile();

  const maxZ = useMemo(() => {
    let mz = 16;
    farmerOrder.forEach((fid) => {
      const f = farmers[fid];
      if (f) mz = Math.max(mz, f.position[2]);
    });
    return mz + 10;
  }, [farmers, farmerOrder]);

  const roadRef = useRef<THREE.InstancedMesh>(null);
  const startZ = -10;
  const endZ = maxZ + 10;
  const step = isMobile ? 3.0 : 2.0; // larger step for better performance with instances on mobile
  const mainSegmentCount = Math.ceil((endZ - startZ) / step);
  const totalSegments = mainSegmentCount + farmerOrder.length;

  useEffect(() => {
    if (!roadRef.current) return;
    let idx = 0;
    
    // Main road
    for (let i = 0; i < mainSegmentCount; i++) {
        const z = startZ + i * step;
        const x = Math.sin(z * 0.05) * 12;
        const nextX = Math.sin((z + step * 1.5) * 0.05) * 12;
        const midX = (x + nextX) / 2;
        const dx = nextX - x;
        const angle = Math.atan2(dx, step * 1.5);
        const y = getCachedTerrainHeight(midX, z + step / 2) + 0.045;

        dummy.position.set(midX, y, z + step / 2);
        dummy.rotation.set(-Math.PI / 2, 0, -angle);
        dummy.scale.set(5.5, step + 0.5, 1);
        dummy.updateMatrix();
        roadRef.current.setMatrixAt(idx++, dummy.matrix);
    }

    // Branch roads
    farmerOrder.forEach((fid) => {
        const f = farmers[fid];
        if (!f) return;
        const [fx, , fz] = f.position;
        const mainRoadX = Math.sin(fz * 0.05) * 12;
        const branchEndX = fx > 0 ? fx - 6 : fx + 6;
        const roadLen = Math.abs(branchEndX - mainRoadX) + 0.5;
        const midX = (mainRoadX + branchEndX) / 2;
        const y = getCachedTerrainHeight(midX, fz) + 0.04;

        dummy.position.set(midX, y, fz);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(roadLen, 3, 1);
        dummy.updateMatrix();
        roadRef.current.setMatrixAt(idx++, dummy.matrix);
    });

    roadRef.current.instanceMatrix.needsUpdate = true;
  }, [farmers, farmerOrder, mainSegmentCount, startZ]);

  return (
    <group>
      <instancedMesh ref={roadRef} args={[undefined, undefined, totalSegments]} castShadow={false} receiveShadow frustumCulled={false}>
         <planeGeometry args={[1, 1]} />
         <meshStandardMaterial map={dirtTex} roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Street Lights along the main road */}
      {Array.from({ length: Math.ceil((endZ - startZ) / (isMobile ? 40 : 20)) }).map((_, i) => {
        const lpz = startZ + i * (isMobile ? 40 : 20);
        const lpx = Math.sin(lpz * 0.05) * 12;
        const y = getCachedTerrainHeight(lpx + 3.5, lpz) + 0;
        return <StreetLight key={`sl-${i}`} position={[lpx + 3.5, y, lpz]} isLeft={false} />;
      })}
    </group>
  );
}

function RiverAccessRoads() {
  const dirtTex = useDirtTexture();
  const bridgeZs = [40, 120, -40, -120];

  return (
    <group>
      {bridgeZs.map((bz) => {
        const mainRoadX = Math.sin(bz * 0.05) * 12;
        const bridgeCenterX = 80 + Math.sin(bz * 0.05) * 8;
        const bridgeLandingX = bridgeCenterX - 16;
        
        const pathStartX = mainRoadX + 2.5;
        const pathEndX = bridgeLandingX - 1.5;
        const pathLen = Math.abs(pathEndX - pathStartX);
        const pathMidX = (pathStartX + pathEndX) / 2;
        const y = getCachedTerrainHeight(pathMidX, bz) + 0.04;

        return (
          <mesh key={`path-to-bridge-${bz}`} position={[pathMidX, y, bz]} rotation={[-Math.PI / 2, 0, 0]} castShadow={false} receiveShadow>
            <planeGeometry args={[pathLen, 6]} />
            <meshStandardMaterial map={dirtTex} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================================
//  HOUSE — AAA Level with Night Glow, Smoke, Porch, Garden
// ============================================================

function ChimneySmoke({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Points>(null);
  const count = 3;
  const isMobile = useIsMobile();

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 0.3;
      p[i * 3 + 1] = Math.random() * 3;
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    if (isMobile || !ref.current) return; // DISABLE on mobile for performance
    const timeOfDay = useVillageStore.getState().timeOfDay;
    const isNight = timeOfDay < 0.3 || timeOfDay > 0.7;
    
    // Fade in/out smoke based on night time
    const mat = ref.current.material as THREE.PointsMaterial;
    if (isNight && mat.opacity < 0.35) mat.opacity = Math.min(0.35, mat.opacity + delta * 0.2);
    else if (!isNight && mat.opacity > 0) mat.opacity = Math.max(0, mat.opacity - delta * 0.2);
    
    if (mat.opacity <= 0) return; // Don't animate positions if invisible

    const pa = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pa.getY(i) + delta * (0.5 + Math.random() * 0.3);
      let x = pa.getX(i) + (Math.random() - 0.5) * delta * 0.3;
      if (y > 4) {
        y = 0;
        x = (Math.random() - 0.5) * 0.3;
      }
      pa.setXYZ(i, x, y, (Math.random() - 0.5) * 0.3);
    }
    pa.needsUpdate = true;
  });

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#aaa8a0" size={0.25} transparent opacity={0} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function House({ position, farmerId }: { position: [number, number, number]; farmerId: string }) {
  const store = useVillageStore();
  const isHovered = store.hoveredObject === `house-${farmerId}`;
  const wallTex = useWallTexture();
  const roofTex = useRoofTexture();
  const woodTex = useWoodTexture();
  const faceAngle = position[0] > 0 ? -Math.PI / 2 : Math.PI / 2;

  // Refs for smooth lighting
  const winMat1 = useRef<THREE.MeshStandardMaterial>(null);
  const winMat2 = useRef<THREE.MeshStandardMaterial>(null);
  const winMat3 = useRef<THREE.MeshStandardMaterial>(null);
  const interiorLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const ts = useVillageStore.getState().timeOfDay;
    // Only update intensities/colors if time passes threshold to save CPU
    if (Math.abs(ts - (interiorLight.current?.userData.lastTs || 0)) < 0.002) return;
    if (interiorLight.current) interiorLight.current.userData.lastTs = ts;

    let nightFactor = 0;
    if (ts < 0.25 || ts > 0.75) nightFactor = 1;
    else if (ts >= 0.25 && ts < 0.3) nightFactor = 1 - (ts - 0.25) / 0.05;
    else if (ts > 0.7 && ts <= 0.75) nightFactor = (ts - 0.7) / 0.05;

    const winColor = _tempColor.copy(_dayColor).lerp(_nightGlowColor, nightFactor);
    const emColor = new THREE.Color().copy(_emissiveDark).lerp(_emissiveGlow, nightFactor);
    const emInt = nightFactor * 2.0;

    [winMat1, winMat2, winMat3].forEach(ref => {
      if (ref.current) {
        ref.current.color.copy(winColor);
        ref.current.emissive.copy(emColor);
        ref.current.emissiveIntensity = emInt;
      }
    });

    if (interiorLight.current) {
      interiorLight.current.intensity = nightFactor * 2.5;
    }
  });

  return (
    <group
      position={position}
      rotation={[0, faceAngle, 0]}
      scale={[3.0, 3.0, 3.0]}
      onPointerEnter={() => store.setHoveredObject(`house-${farmerId}`)}
      onPointerLeave={() => store.setHoveredObject(null)}
      onClick={(e) => { e.stopPropagation(); store.setSelectedFarmer(farmerId); }}
    >
      {/* Walls */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2.5, 1.6, 2.5]} />
        <meshStandardMaterial map={wallTex} color={isHovered ? '#ffe0b0' : '#ffffff'} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 2, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.2, 1.5, 4]} />
        <meshStandardMaterial map={roofTex} color={isHovered ? '#c0a080' : '#ffffff'} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.5, 1.26]}>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
      {/* Windows with night glow */}
      <mesh position={[0.8, 0.9, 1.26]}>
        <boxGeometry args={[0.35, 0.35, 0.05]} />
        <meshStandardMaterial ref={winMat1} color="#87CEEB" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.8, 0.9, 1.26]}>
        <boxGeometry args={[0.35, 0.35, 0.05]} />
        <meshStandardMaterial ref={winMat2} color="#87CEEB" transparent opacity={0.6} />
      </mesh>
      {/* Side window */}
      <mesh position={[1.26, 0.9, 0]}>
        <boxGeometry args={[0.05, 0.35, 0.35]} />
        <meshStandardMaterial ref={winMat3} color="#87CEEB" transparent opacity={0.6} />
      </mesh>
      {/* Interior glow at night */}
      <pointLight ref={interiorLight} position={[0, 1, 0]} color="#ff9933" intensity={0} distance={8} decay={2} />

      {/* Chimney */}
      <mesh position={[0.8, 2.8, -0.5]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      {/* Chimney smoke */}
      <ChimneySmoke position={[0.8, 3.2, -0.5]} />
      {/* Porch - wooden platform */}
      <mesh position={[0, 0.05, 1.8]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.1, 1]} />
        <meshStandardMaterial map={woodTex} roughness={0.9} />
      </mesh>
      {/* Porch step */}
      <mesh position={[0, -0.1, 2.35]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.15, 0.3]} />
        <meshStandardMaterial map={woodTex} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ============================================================
//  LARGE CROPLAND with color differentiation (HUGE 12x12)
// ============================================================

const dummy = new THREE.Object3D();

function AnimatedCropland({ position, farmerId, cropColor, rows, healthColor, emissiveColor, emissiveIntensity }: { position: [number, number, number]; farmerId: string; cropColor: string, rows: [number, number, number][], healthColor: string, emissiveColor: string, emissiveIntensity: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const growth = useVillageStore((s) => s.cropGrowth[farmerId] || 0.3);
  const isIrrigating = useVillageStore((s) => !!s.irrigatingFarms[farmerId]);

  // Only update matrices when growth changes to save CPU/GPU bandwidth
  useEffect(() => {
    if (!meshRef.current) return;
    const h = 0.2 + growth * 0.6;
    rows.forEach((pos, i) => {
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.scale.set(h, h, h);
      dummy.rotation.set(0, 0, 0); 
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [growth, rows]);

  // Handle growth state updates in a controlled way
  useFrame((_, delta) => {
    if (isIrrigating) {
      // Throttle or use state directly
      useVillageStore.getState().updateCropGrowth(farmerId, delta * 0.02);
    }
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, rows.length]} receiveShadow>
        <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
        <meshStandardMaterial color={healthColor} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

// --- Procedural Animated Animals ---
function Animal({ type, position, rotation }: { type: 'cow' | 'pig' | 'sheep' | 'chicken', position: [number, number, number], rotation: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const isMobile = useIsMobile();

  useFrame((state) => {
    if (isMobile || !groupRef.current) return; // DISABLE on mobile for performance
        // Subtle grazing and breathing wobble!
        groupRef.current.rotation.y = rotation + Math.sin(state.clock.elapsedTime * 0.5 + phase) * 0.2;
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + phase) * 0.02;
  });

  return (
    <group ref={groupRef} position={position}>
      {type === 'cow' && (
        <group>
          {/* Boxy Cow Body */}
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.5, 0.4, 0.8]} /><meshStandardMaterial color="#8B4513" /></mesh>
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.55, 0.3, 0.4]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[0, 0.6, 0.45]} castShadow><boxGeometry args={[0.3, 0.3, 0.4]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[0, 0.55, 0.6]} castShadow><boxGeometry args={[0.2, 0.15, 0.1]} /><meshStandardMaterial color="#ffb6c1" /></mesh>
          {/* Legs */}
          {[-0.2, 0.2].map(x => [-0.3, 0.3].map(z => 
             <mesh key={`${x}-${z}`} position={[x, 0.15, z]} castShadow><cylinderGeometry args={[0.04, 0.03, 0.3, 4]} /><meshStandardMaterial color="#fff" /></mesh>
          ))}
        </group>
      )}
      {type === 'pig' && (
        <group scale={[0.8, 0.8, 0.8]} position={[0, -0.1, 0]}>
          {/* Pink Piggy Body */}
          <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.4, 0.3, 0.6]} /><meshStandardMaterial color="#ffb6c1" /></mesh>
          <mesh position={[0, 0.35, 0.35]} castShadow><boxGeometry args={[0.25, 0.25, 0.25]} /><meshStandardMaterial color="#ffb6c1" /></mesh>
          <mesh position={[0, 0.3, 0.5]} castShadow><boxGeometry args={[0.15, 0.1, 0.1]} /><meshStandardMaterial color="#ff99a8" /></mesh>
           {[-0.15, 0.15].map(x => [-0.2, 0.2].map(z => 
             <mesh key={`${x}-${z}`} position={[x, 0.1, z]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.2, 4]} /><meshStandardMaterial color="#ff99a8" /></mesh>
          ))}
        </group>
      )}
      {type === 'sheep' && (
        <group scale={[0.7, 0.7, 0.7]}>
          {/* Fluffy Sheep */}
          <mesh position={[0, 0.35, 0]} castShadow><sphereGeometry args={[0.3, 8, 8]} /><meshStandardMaterial color="#ffffff" roughness={1} /></mesh>
          <mesh position={[0, 0.45, 0.25]} castShadow><boxGeometry args={[0.15, 0.15, 0.2]} /><meshStandardMaterial color="#222" /></mesh>
           {[-0.1, 0.1].map(x => [-0.15, 0.15].map(z => 
             <mesh key={`${x}-${z}`} position={[x, 0.1, z]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.2, 4]} /><meshStandardMaterial color="#222" /></mesh>
          ))}
        </group>
      )}
      {type === 'chicken' && (
        <group scale={[0.3, 0.3, 0.3]} position={[0, -0.2, 0]}>
          {/* Tiny Chickens */}
          <mesh position={[0, 0.3, 0]} castShadow><sphereGeometry args={[0.2, 6, 6]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[0, 0.4, 0.15]} castShadow><sphereGeometry args={[0.12, 6, 6]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[0, 0.4, 0.28]} castShadow rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[0.05, 0.1, 4]} />
            <meshStandardMaterial color="#ffd700" />
          </mesh>
          <mesh position={[0, 0.55, 0.15]} castShadow><boxGeometry args={[0.05, 0.1, 0.1]} /><meshStandardMaterial color="#ff0000" /></mesh>
        </group>
      )}
    </group>
  );
}

function LivestockHerd({ position, rows }: { position: [number, number, number], rows: [number, number, number][] }) {
  // Spawn animals at completely random, valid cropland grid spots so they fit any boundary natively!
  const animals = useMemo(() => {
    if (rows.length === 0) return [];
    const arr = [];
    // Define herd layout
    const types: ('cow'|'pig'|'sheep'|'chicken')[] = ['cow', 'cow', 'pig', 'pig', 'pig', 'sheep', 'sheep', 'sheep', 'sheep', 'chicken', 'chicken', 'chicken', 'chicken', 'chicken'];
    
    // Pick unique spots ensuring animals spawn perfectly enclosed even inside a custom drawn polygon!
    const availableSpots = [...rows].sort(() => 0.5 - Math.random());
    
    for (const t of types) {
      if (availableSpots.length === 0) break;
      const spot = availableSpots.pop()!;
      arr.push({
        type: t,
        position: [spot[0], 0.1, spot[2]] as [number, number, number],
        rotation: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }, [rows]);

  return (
    <group position={position}>
      {/* Wooden Animal Shelter */}
      <mesh position={[-3, 1.5, -4]} castShadow><boxGeometry args={[4, 2, 3]} /><meshStandardMaterial color="#8B4513" /></mesh>
      <mesh position={[-3, 3, -4]} castShadow rotation={[0,0,Math.PI/4]}><boxGeometry args={[3.2, 3.2, 3.4]} /><meshStandardMaterial color="#5a2e0e" /></mesh>

      {/* Water Trough */}
      <mesh position={[0, 0.3, 4]} castShadow><boxGeometry args={[3, 0.4, 1]} /><meshStandardMaterial color="#555" /></mesh>
      <mesh position={[0, 0.45, 4]}><boxGeometry args={[2.8, 0.1, 0.8]} /><meshStandardMaterial color="#4fc3f7" /></mesh>

      {/* Renders the full herd inside! */}
      {animals.map((a, i) => <Animal key={i} {...a} />)}
    </group>
  );
}

// A fast ray-casting algorithm for Point In Polygon
function isInsidePolygon(point: [number, number], vs: [number, number, number][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][2];
    const xj = vs[j][0], yj = vs[j][2];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// IoT Devices moved to IoTDevices.tsx

function Cropland({ position, farmerId, farmer, colorIndex, isLivestock }: { position: [number, number, number]; farmerId: string; farmer: VillageFarmer; colorIndex: number; isLivestock?: boolean }) {
  const store = useVillageStore();
  const isHovered = store.hoveredObject === `crop-${farmerId}`;
  const hasAlert = farmer.tasks.some((t) => !t.completed);
  const cropTex = useCropTexture();
  const woodTex = useWoodTexture();
  const stoneTex = useStoneTexture();
  const dirtTex = useDirtTexture();
  const cropColor = CROP_COLORS[colorIndex % CROP_COLORS.length];

  const health = farmer.health ?? 100;
  let healthColor = cropColor;
  let emissiveColor = '#000000';
  let emissiveIntensity = 0;

  if (health <= 30) {
    healthColor = '#ff4d4d'; // Critical Red
    emissiveColor = '#ff0000';
    emissiveIntensity = 0.5;
  } else if (health <= 60) {
    healthColor = '#ffcc00'; // Warning Yellow
    emissiveColor = '#cc8800';
    emissiveIntensity = 0.3;
  }

  if (isHovered) {
    emissiveColor = '#ffffff';
    emissiveIntensity = 0.2;
  }

  // --- Calculate rows and soil geometry ---
  const { rows, customShape } = useMemo(() => {
    const items: [number, number, number][] = [];
    let shape: THREE.Shape | null = null;

    if (farmer.customPolygon) {
      // Custom Lasso Polygon
      const poly = farmer.customPolygon;
      const [baseX, , baseZ] = farmer.position;

      shape = new THREE.Shape();
      poly.forEach((p, i) => {
        const px = p[0] - baseX;
        const pz = p[2] - baseZ;
        if (i === 0) shape!.moveTo(px, pz);
        else shape!.lineTo(px, pz);
      });
      shape.closePath();

      const xs = poly.map(p => p[0]);
      const zs = poly.map(p => p[2]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minZ = Math.min(...zs), maxZ = Math.max(...zs);

      for (let x = minX; x <= maxX; x += 0.5) {
        for (let z = minZ; z <= maxZ; z += 0.5) {
          // Check road intersection
          const roadX = Math.sin(z * 0.05) * 12;
          if (Math.abs(x - roadX) < 3.2) continue; // Skip crop on road

          if (isInsidePolygon([x, z], poly)) {
            items.push([x - baseX + (Math.random() - 0.5) * 0.2, 0.12, z - baseZ + (Math.random() - 0.5) * 0.2]);
          }
        }
      }
    } else {
      // Standard 16x16 (increased from 12x12)
      for (let x = -7.8; x <= 7.8; x += 0.5) {
        for (let z = -7.8; z <= 7.8; z += 0.5) {
          items.push([x + (Math.random() - 0.5) * 0.2, 0.12, z + (Math.random() - 0.5) * 0.2]);
        }
      }
    }
    return { rows: items, customShape: shape };
  }, [farmer.position, farmer.customPolygon]);

  const extrudeSettings = useMemo(() => ({ depth: 0.01, bevelEnabled: false }), []);

  return (
    <group
      position={position}
      onPointerEnter={() => store.setHoveredObject(`crop-${farmerId}`)}
      onPointerLeave={() => store.setHoveredObject(null)}
      onClick={(e) => { e.stopPropagation(); store.setSelectedFarmer(farmerId); }}
    >
      <mesh receiveShadow position={customShape ? [0, 0.02, 0] : [0, 0.02, 0]} rotation={customShape ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
        {customShape ? (
          <extrudeGeometry args={[customShape, extrudeSettings]} />
        ) : (
          <boxGeometry args={[16.5, 0.08, 16.5]} />
        )}
        <meshStandardMaterial map={isLivestock ? dirtTex : stoneTex} color={isHovered ? '#ffebc0' : (health <= 60 ? healthColor : (isLivestock ? '#8a6c4b' : "#2a1f18"))} emissive={emissiveColor} emissiveIntensity={emissiveIntensity * 0.3} roughness={1} />
      </mesh>

      {rows.length > 0 && !isLivestock && <AnimatedCropland position={customShape ? [0, 0, 0] : [0, 0.1, 0]} farmerId={farmerId} cropColor={cropColor} rows={rows} healthColor={healthColor} emissiveColor={emissiveColor} emissiveIntensity={emissiveIntensity} />}
      {rows.length > 0 && isLivestock && <LivestockHerd position={customShape ? [0, 0, 0] : [0, 0.1, 0]} rows={rows} />}

      {/* IoT Infrastructure in the field */}
      {!isLivestock && (
        <group>
          <IoTStation position={[customShape ? rows[0]?.[0] : -6, 0.1, customShape ? rows[0]?.[2] : -6]} />
          <ScrutinyCamera position={[customShape ? rows[rows.length-1]?.[0] : 7, 0.1, customShape ? rows[rows.length-1]?.[2] : 7]} />
        </group>
      )}

      {hasAlert && (
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Custom Fences */}
      {customShape && farmer.fenceType && farmer.fenceType !== 'none' && (
        <group position={[0, 0.4, 0]}>
          {farmer.customPolygon!.map((p, i) => {
            const nextP = farmer.customPolygon![(i + 1) % farmer.customPolygon!.length];
            const px1 = p[0] - position[0];
            const pz1 = p[2] - position[2];
            const px2 = nextP[0] - position[0];
            const pz2 = nextP[2] - position[2];
            const dx = px2 - px1;
            const dz = pz2 - pz1;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);
            const midX = (px1 + px2) / 2;
            const midZ = (pz1 + pz2) / 2;
            const dbX = (p[0] + nextP[0]) / 2;
            const dbZ = (p[2] + nextP[2]) / 2;
            const roadXAtPoint = Math.sin(dbZ * 0.05) * 12;
            // Prevent drawing fences clearly across the road
            if (Math.abs(dbX - roadXAtPoint) < 3.2 && dist > 1.0) {
              return null; // Skip this fence segment (make a hole for the road)
            }

            if (farmer.fenceType === 'wood') {
              return (
                <group key={i}>
                  <mesh position={[px1, 0, pz1]} castShadow receiveShadow><boxGeometry args={[0.2, 1, 0.2]} /><meshStandardMaterial map={woodTex} /></mesh>
                  <mesh position={[midX, 0.1, midZ]} rotation={[0, -angle, 0]} castShadow receiveShadow><boxGeometry args={[dist, 0.1, 0.05]} /><meshStandardMaterial map={woodTex} /></mesh>
                  <mesh position={[midX, -0.2, midZ]} rotation={[0, -angle, 0]} castShadow receiveShadow><boxGeometry args={[dist, 0.1, 0.05]} /><meshStandardMaterial map={woodTex} /></mesh>
                </group>
              );
            } else if (farmer.fenceType === 'stone') {
              return (
                <mesh key={i} position={[midX, -0.1, midZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
                  <boxGeometry args={[dist, 0.6, 0.4]} />
                  <meshStandardMaterial color="#888" map={stoneTex} />
                </mesh>
              );
            } else if (farmer.fenceType === 'wire') {
              return (
                <group key={i}>
                  <mesh position={[px1, 0, pz1]} castShadow receiveShadow><cylinderGeometry args={[0.05, 0.05, 1, 6]} /><meshStandardMaterial color="#444" /></mesh>
                  <mesh position={[midX, -0.2, midZ]} rotation={[Math.PI / 2, 0, Math.PI / 2 - angle]} castShadow receiveShadow><cylinderGeometry args={[0.01, 0.01, dist, 4]} /><meshStandardMaterial color="#555" /></mesh>
                </group>
              );
            }
            return null;
          })}
        </group>
      )}


      {/* Standard Form Fences */}
      {!customShape && (
        <>
          <mesh position={[0, 0.35, -8.1]} castShadow receiveShadow><boxGeometry args={[16.4, 0.08, 0.08]} /><meshStandardMaterial map={woodTex} /></mesh>
          <mesh position={[0, 0.35, 8.1]} castShadow receiveShadow><boxGeometry args={[16.4, 0.08, 0.08]} /><meshStandardMaterial map={woodTex} /></mesh>
          <mesh position={[-8.1, 0.35, 0]} castShadow receiveShadow><boxGeometry args={[0.08, 0.08, 16.4]} /><meshStandardMaterial map={woodTex} /></mesh>
          <mesh position={[8.1, 0.35, 0]} castShadow receiveShadow><boxGeometry args={[0.08, 0.08, 16.4]} /><meshStandardMaterial map={woodTex} /></mesh>
          {[[-8.1, -8.1], [-8.1, 8.1], [8.1, -8.1], [8.1, 8.1]].map(([fx, fz], i) => (
            <mesh key={i} position={[fx, 0.4, fz]} castShadow receiveShadow>
              <boxGeometry args={[0.15, 0.9, 0.15]} />
              <meshStandardMaterial map={woodTex} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

// ============================================================
//  WELL
// ============================================================

function Well({ position, farmerId }: { position: [number, number, number]; farmerId: string }) {
  const store = useVillageStore();
  const isHovered = store.hoveredObject === `well-${farmerId}`;
  const stoneTex = useStoneTexture();
  const waterTex = useWaterTexture();
  const woodTex = useWoodTexture();

  return (
    <group
      position={position}
      scale={[1.5, 1.5, 1.5]}
      onPointerEnter={() => store.setHoveredObject(`well-${farmerId}`)}
      onPointerLeave={() => store.setHoveredObject(null)}
      onClick={(e) => { e.stopPropagation(); store.setSelectedBuilding('well'); }}
    >
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.8, 8]} />
        <meshStandardMaterial map={stoneTex} color={isHovered ? '#bbb' : '#ffffff'} />
      </mesh>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[0.65, 0.65, 0.1, 8]} />
        <meshBasicMaterial map={waterTex} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.5, 1.2, 0]} castShadow receiveShadow><boxGeometry args={[0.08, 1.6, 0.08]} /><meshStandardMaterial map={woodTex} /></mesh>
      <mesh position={[0.5, 1.2, 0]} castShadow receiveShadow><boxGeometry args={[0.08, 1.6, 0.08]} /><meshStandardMaterial map={woodTex} /></mesh>
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.8, 0.6, 4]} />
        <meshStandardMaterial color="#8B4513" map={woodTex} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.2, 6]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
}

// ============================================================
//  WATER ANIMATION
// ============================================================

function WaterFlow({ wellPos, cropPos }: { wellPos: [number, number, number]; cropPos: [number, number, number] }) {
  const particlesRef = useRef<THREE.Points>(null);
  const COUNT = 15;
  const { positions, velocities } = useMemo(() => {
    const p = new Float32Array(COUNT * 3);
    const v = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) v[i] = Math.random();
    return { positions: p, velocities: v };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const pa = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      velocities[i] += delta * (0.3 + Math.random() * 0.2);
      if (velocities[i] > 1) velocities[i] = 0;
      const t = velocities[i];
      pa.setXYZ(i, wellPos[0] + (cropPos[0] - wellPos[0]) * t, 1.5 + Math.sin(t * Math.PI) * 1.5, wellPos[2] + (cropPos[2] - wellPos[2]) * t);
    }
    pa.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} /></bufferGeometry>
      <pointsMaterial color="#4fc3f7" size={0.15} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function WaterFlows() {
  const irrigating = useVillageStore((s) => s.irrigatingFarms);
  const farmers = useVillageStore((s) => s.farmers);
  const ids = Object.keys(irrigating);
  if (ids.length === 0) return null;

  return (
    <group>
      {ids.map((fid) => {
        const f = farmers[fid];
        if (!f) return null;
        const [x, , z] = f.position;
        const isLeft = x < 0;

        const wellX = x + (isLeft ? 4 : -4);
        const wellZ = z - 4;
        const cropX = x + (isLeft ? -9 : 9);

        const wellY = getTerrainHeight(wellX, wellZ);
        const cropY = getTerrainHeight(cropX, z);

        return <WaterFlow key={fid} wellPos={[wellX, wellY, wellZ]} cropPos={[cropX, cropY, z]} />;
      })}
    </group>
  );
}

function IrrigationManager() {
  const irrigating = useVillageStore((s) => s.irrigatingFarms);
  const stop = useVillageStore((s) => s.stopIrrigating);
  useFrame(() => {
    const now = Date.now();
    for (const [id, t] of Object.entries(irrigating)) {
      if (now - t > 8000) stop(id);
    }
  });
  return null;
}

// ============================================================
//  STREET LIGHT
// ============================================================

function StreetLight({ position, isLeft }: { position: [number, number, number], isLeft: boolean }) {
  const dir = isLeft ? 1 : -1;
  const bulbRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightsRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const ts = useVillageStore.getState().timeOfDay;
    let nightFactor = 0;
    if (ts < 0.25 || ts > 0.75) nightFactor = 1;
    else if (ts >= 0.25 && ts < 0.3) nightFactor = 1 - (ts - 0.25) / 0.05;
    else if (ts > 0.7 && ts <= 0.75) nightFactor = (ts - 0.7) / 0.05;

    if (bulbRef.current) {
      bulbRef.current.color.copy(_bulbOff).lerp(_bulbOn, nightFactor);
    }
    if (lightsRef.current) {
      lightsRef.current.children.forEach((l) => {
        const pl = l as THREE.PointLight;
        if (pl.isPointLight) pl.intensity = nightFactor * 1.5;
      });
    }
  });
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.08, 4, 8]} />
        <meshStandardMaterial color="#4a3b2c" roughness={0.9} />
      </mesh>
      {/* Bracket */}
      <mesh position={[dir * 0.3, 3.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Fixture cap */}
      <mesh position={[dir * 0.5, 3.75, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.1, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Bulb */}
      <mesh position={[dir * 0.5, 3.65, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial ref={bulbRef} color="#666666" />
      </mesh>
      {/* Glow Effect / Light Source */}
      <group ref={lightsRef}>
        <pointLight position={[dir * 0.5, 3.5, 0]} color="#ffb033" intensity={0} distance={20} decay={2} castShadow={false} />
      </group>
    </group>
  );
}

// ============================================================
//  FARM COMPOUND
// ============================================================

function FarmCompound({ farmerId, index, isLivestock }: { farmerId: string; index: number; isLivestock?: boolean }) {
  const farmer = useVillageStore((s) => s.farmers[farmerId]);
  if (!farmer) return null;
  const [baseX, , baseZ] = farmer.position;

  if (farmer.customPolygon) {
    // Find the lowest X (right-most edge) to place the house cleanly on the edge of the shape, not inside it!
    let minXPos = farmer.customPolygon[0];
    for (const p of farmer.customPolygon) {
      if (p[0] < minXPos[0]) minXPos = p;
    }

    const houseX = minXPos[0] - 2; // Offset house outside the polygon slightly
    const houseZ = minXPos[2];

    const wellX = houseX - 3.5;
    const wellZ = houseZ + 1.5;

    const cropY = getTerrainHeight(baseX, baseZ);
    return (
      <group>
        <House position={[houseX, getTerrainHeight(houseX, houseZ), houseZ]} farmerId={farmerId} />
        {/* Note: the custom shape calculation already subtracts centroid base so we pass it in the position to be applied! */}
        <Cropland position={[baseX, cropY, baseZ]} farmerId={farmerId} farmer={farmer} colorIndex={index} isLivestock={isLivestock} />
        <Well position={[wellX, getTerrainHeight(wellX, wellZ), wellZ]} farmerId={farmerId} />
        {/* Streetlight connecting the house */}
        <StreetLight position={[houseX + 2, getTerrainHeight(houseX + 2, houseZ + 2), houseZ + 2]} isLeft={true} />
      </group>
    );
  }

  // Standard procedural setup
  const isLeft = baseX < 0;
  const cropX = isLeft ? baseX - 12 : baseX + 12;
  const wellX = isLeft ? baseX + 5 : baseX - 5;

  // Calculate road alignment for streetlights
  const mainRoadX = Math.sin(baseZ * 0.05) * 12;
  const roadX = isLeft ? mainRoadX - 3 : mainRoadX + 3;

  return (
    <group>
      <House position={[baseX, getTerrainHeight(baseX, baseZ), baseZ]} farmerId={farmerId} />
      <Cropland position={[cropX, getTerrainHeight(cropX, baseZ), baseZ]} farmerId={farmerId} farmer={farmer} colorIndex={index} isLivestock={isLivestock} />
      <Well position={[wellX, getTerrainHeight(wellX, baseZ - 4), baseZ - 4]} farmerId={farmerId} />
      <StreetLight position={[roadX, getTerrainHeight(roadX, baseZ), baseZ]} isLeft={isLeft} />
    </group>
  );
}

// ============================================================
//  MAIN EXPORT
// ============================================================

function IndependentLivestockPens() {
  const pens = [
    { id: 'ls-1', position: [-60, getTerrainHeight(-60, -30), -30] },
    { id: 'ls-2', position: [65, getTerrainHeight(65, 5), 5] },
    { id: 'ls-3', position: [-55, getTerrainHeight(-55, 45), 45] },
  ];

  return (
    <group>
      {pens.map((pen, i) => {
        const rows: [number, number, number][] = [];
        for (let x = -4; x <= 4; x += 1) {
          for (let z = -4; z <= 4; z += 1) {
            rows.push([x + (Math.random() - 0.5), 0.12, z + (Math.random() - 0.5)]);
          }
        }
        return (
          <group key={pen.id} position={pen.position as [number, number, number]}>
            <mesh receiveShadow position={[0, 0.02, 0]}>
              <boxGeometry args={[10, 0.08, 10]} />
              <meshStandardMaterial color="#5e4c3a" roughness={1} />
            </mesh>
            <LivestockHerd position={[0, 0.1, 0]} rows={rows} />
            {/* Wooden compound fence */}
            <mesh position={[0, 0.5, -4.9]} castShadow><boxGeometry args={[9.8, 1, 0.1]} /><meshStandardMaterial color="#6a4c2a" /></mesh>
            <mesh position={[0, 0.5, 4.9]} castShadow><boxGeometry args={[9.8, 1, 0.1]} /><meshStandardMaterial color="#6a4c2a" /></mesh>
            <mesh position={[-4.9, 0.5, 0]} castShadow><boxGeometry args={[0.1, 1, 9.8]} /><meshStandardMaterial color="#6a4c2a" /></mesh>
            <mesh position={[4.9, 0.5, 0]} castShadow><boxGeometry args={[0.1, 1, 9.8]} /><meshStandardMaterial color="#6a4c2a" /></mesh>
          </group>
        );
      })}
    </group>
  );
}

function WildHouse({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const wallTex = useWallTexture();
  const roofTex = useRoofTexture();
  const woodTex = useWoodTexture();
  const rotation = useMemo(() => Math.random() * Math.PI * 2, []);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2.5, 1.6, 2.5]} />
        <meshStandardMaterial map={wallTex} />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.2, 1.5, 4]} />
        <meshStandardMaterial map={roofTex} />
      </mesh>
      <mesh position={[0, 0.5, 1.26]}>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
      {/* Small porch */}
      <mesh position={[0, 0.05, 1.6]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.1, 0.8]} />
        <meshStandardMaterial map={woodTex} />
      </mesh>
    </group>
  );
}

function ScatteredWildFarms() {
  const pathRef = useRef<THREE.InstancedMesh>(null);
  
  const totalPlants = useMemo(() => {
    return wildScenery.farms.reduce((acc, f) => acc + Math.ceil(f.size * 2), 0);
  }, []);

  useEffect(() => {
    if (!pathRef.current) return;
    let idx = 0;
    wildScenery.farms.forEach((f) => {
      const pCount = Math.ceil(f.size * 2);
      for (let j = 0; j < pCount; j++) {
        const px = f.position[0] + (Math.random() - 0.5) * f.size * 0.8;
        const pz = f.position[2] + (Math.random() - 0.5) * f.size * 0.8;
        const h = 0.2 + Math.random() * 0.4;
        const py = getTerrainHeight(px, pz) + h / 2;
        
        dummy.position.set(px, py, pz);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pathRef.current!.setMatrixAt(idx++, dummy.matrix);
      }
    });
    pathRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      {wildScenery.farms.map((f, i) => (
        <group key={i} position={f.position}>
          <mesh receiveShadow position={[0, 0.02, 0]}>
            <boxGeometry args={[f.size, 0.08, f.size]} />
            <meshStandardMaterial color={f.color} opacity={0.7} transparent roughness={1} />
          </mesh>
          <IoTStation position={[(Math.random() - 0.5) * f.size * 0.4, 0.1, (Math.random() - 0.5) * f.size * 0.4]} />
          {f.size > 12 && <ScrutinyCamera position={[f.size * 0.4, 0.1, f.size * 0.4]} />}
          <WildHouse position={[f.size * 0.6 + 1.5, 0, (Math.random() - 0.5) * 4]} scale={0.5 + Math.random() * 0.4} />
        </group>
      ))}
      <instancedMesh ref={pathRef} args={[undefined, undefined, totalPlants]} receiveShadow>
        <cylinderGeometry args={[0.06, 0.08, 1, 5]} />
        <meshStandardMaterial color="#4a5a2a" />
      </instancedMesh>
    </group>
  );
}

// Path decorations - optimized with instancing
function PathDecorations() {
  const farmers = useVillageStore((s) => s.farmers);
  const farmerOrder = useVillageStore((s) => s.farmerOrder);
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (!bushRef.current || !rockRef.current) return;
    let bIdx = 0, rIdx = 0;
    
    farmerOrder.forEach((fid) => {
      const f = farmers[fid];
      if (!f) return;
      const [fx, , fz] = f.position;
      const mainRoadX = Math.sin(fz * 0.05) * 12;
      const isLeft = fx < 0;
      const roadStart = isLeft ? mainRoadX - 2.5 : mainRoadX + 2.5;
      const roadEnd = isLeft ? fx - 14 : fx + 14;

      for (let i = 0; i < 8; i++) {
        const t = (i + 1) / 9;
        const x = roadStart + (roadEnd - roadStart) * t;
        const zOffset = (Math.random() - 0.5) * 2;
        const y = getTerrainHeight(x, fz + zOffset);
        
        dummy.position.set(x, y, fz + zOffset);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        
        if (Math.random() < 0.6) {
          if (bIdx < farmerOrder.length * 8) bushRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        } else {
          if (rIdx < farmerOrder.length * 8) rockRef.current!.setMatrixAt(rIdx++, dummy.matrix);
        }
      }
    });
    bushRef.current.instanceMatrix.needsUpdate = true;
    rockRef.current.instanceMatrix.needsUpdate = true;
  }, [farmerOrder, farmers]);
  
  return (
    <group>
      <instancedMesh ref={bushRef} args={[undefined, undefined, farmerOrder.length * 8]} castShadow>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#3d5a2d" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, farmerOrder.length * 8]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        <meshStandardMaterial color="#666" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

export function VillageStructures() {
  const farmerOrder = useVillageStore((s) => s.farmerOrder);

  return (
    <group>
      <VillageRoads />
      <RiverAccessRoads />
      <ScatteredWildFarms />
      {farmerOrder.map((fid, i) => (
        <FarmCompound key={fid} farmerId={fid} index={i} isLivestock={false} />
      ))}
      <IndependentLivestockPens />
      <WaterFlows />
      <IrrigationManager />
      <PathDecorations />
    </group>
  );
}
