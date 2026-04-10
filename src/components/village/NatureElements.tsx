import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useVillageStore } from '@/store/villageStore';
import { getTerrainHeight } from '@/utils/terrainUtils';
import { wildScenery } from '@/data/wildScenery';
import { useIsMobile } from '@/hooks/use-mobile';

const dummy = new THREE.Object3D();

function getVillageMaxZ() {
  const farmers = useVillageStore.getState().farmers;
  return Math.max(16, ...Object.values(farmers).map(f => f.position[2] || 0));
}

// Check if a point is too close to any wild farm
function isNearWildFarm(x: number, z: number) {
  return wildScenery.farms.some(f => {
    const dx = f.position[0] - x;
    const dz = f.position[2] - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < (f.size / 2 + 5); // Avoid farm area + small buffer
  });
}

// Scatters items outside the village central area
function getScatteredPosition(maxZ: number, exclusionRadiusX: number): [number, number] {
  let tx = 0, tz = 0;
  for (let i = 0; i < 100; i++) {
    tx = (Math.random() - 0.5) * 550; 
    tz = -150 + Math.random() * (maxZ + 450);
    
    // Original exclusions
    if (Math.abs(tx) < exclusionRadiusX && tz > -40 && tz < maxZ + 40) {
      continue;
    }
    // Also exclude river zone
    const riverCenter = Math.sin(tz * 0.05) * 8 + 80;
    if (Math.abs(tx - riverCenter) < 15) continue;

    // AVOID WILD FARMS
    if (isNearWildFarm(tx, tz)) continue;
    
    return [tx, tz];
  }
  return [200, 200];
}

// Positions near the village but between farms
function getNearVillagePosition(maxZ: number): [number, number] {
  let tx = 0, tz = 0;
  for (let i = 0; i < 100; i++) {
    tx = (Math.random() - 0.5) * 150;
    tz = -20 + Math.random() * (maxZ + 40);
    
    // Keep between farms - near roads
    const roadX = Math.sin(tz * 0.05) * 12;
    const distToRoad = Math.abs(tx - roadX);
    if (distToRoad < 4 || distToRoad > 10) continue;
    
    // Avoid river
    const riverCenter = Math.sin(tz * 0.05) * 8 + 80;
    if (Math.abs(tx - riverCenter) < 15) continue;

    // AVOID WILD FARMS
    if (isNearWildFarm(tx, tz)) continue;
    
    return [tx, tz];
  }
  return [50, 50];
}

export function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const isMobile = useIsMobile();
  const count = isMobile ? 60 : 100;

  useEffect(() => {
    if (!ref.current) return;
    const maxZ = getVillageMaxZ();

    for (let i = 0; i < count; i++) {
      const [tx, tz] = getScatteredPosition(maxZ, 55);
      const ty = getTerrainHeight(tx, tz);

      dummy.position.set(tx, ty - 0.15, tz);
      const s = 0.4 + Math.random() * 1.8;
      dummy.scale.set(s, s * (0.4 + Math.random() * 0.4), s);
      dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, isMobile]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow={false} receiveShadow={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#6a6860" roughness={0.95} flatShading />
    </instancedMesh>
  );
}

// AAA Forest with multiple tree types
export function Forest() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const isMobile = useIsMobile();
  
  const regularCount = isMobile ? 220 : 380;
  const bushCount = isMobile ? 100 : 200;

  useEffect(() => {
    if (!trunkRef.current || !leafRef.current) return;
    const maxZ = getVillageMaxZ();
    
    let leafIndex = 0;
    for (let i = 0; i < regularCount; i++) {
      const [tx, tz] = getScatteredPosition(maxZ, 58);
      const ty = getTerrainHeight(tx, tz);
      const scale = 0.7 + Math.random() * 0.7;

      // Trunk
      dummy.position.set(tx, ty + 1.4 * scale, tz);
      dummy.scale.set(scale * 0.8, scale, scale * 0.8);
      dummy.rotation.set((Math.random() - 0.5) * 0.1, Math.random() * Math.PI, (Math.random() - 0.5) * 0.1);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);

      // Center leaf cluster
      const leafScale = scale * 1.5;
      dummy.position.set(tx, ty + 3.2 * scale, tz);
      dummy.scale.set(leafScale, leafScale, leafScale);
      dummy.updateMatrix();
      leafRef.current.setMatrixAt(leafIndex++, dummy.matrix);

      // Side cluster 1
      dummy.position.set(tx + 0.9 * scale, ty + 2.7 * scale, tz + 0.4 * scale);
      dummy.scale.set(leafScale * 0.75, leafScale * 0.75, leafScale * 0.75);
      dummy.updateMatrix();
      leafRef.current.setMatrixAt(leafIndex++, dummy.matrix);

      // Side cluster 2
      dummy.position.set(tx - 0.7 * scale, ty + 2.8 * scale, tz - 0.5 * scale);
      dummy.scale.set(leafScale * 0.7, leafScale * 0.7, leafScale * 0.7);
      dummy.updateMatrix();
      leafRef.current.setMatrixAt(leafIndex++, dummy.matrix);
    }
    
    trunkRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
  }, [regularCount, isMobile]);


  // Bushes
  useEffect(() => {
    if (!bushRef.current) return;
    const maxZ = getVillageMaxZ();
    
    for (let i = 0; i < bushCount; i++) {
      const [tx, tz] = i < bushCount / 3 
        ? getNearVillagePosition(maxZ) 
        : getScatteredPosition(maxZ, 45);
      const ty = getTerrainHeight(tx, tz);
      const scale = 0.3 + Math.random() * 0.5;

      dummy.position.set(tx, ty + scale * 0.4, tz);
      dummy.scale.set(scale, scale * (0.6 + Math.random() * 0.4), scale);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      bushRef.current.setMatrixAt(i, dummy.matrix);
    }
    bushRef.current.instanceMatrix.needsUpdate = true;
  }, [bushCount, isMobile]);

  return (
    <group>
      {/* Regular tree trunks */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, regularCount]} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.15, 0.3, 2.8, 6]} />
        <meshStandardMaterial color="#3a2210" roughness={0.9} />
      </instancedMesh>

      {/* Regular tree leaves */}
      <instancedMesh ref={leafRef} args={[undefined, undefined, regularCount * 3]} castShadow={false} receiveShadow={false}>
        <dodecahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial color="#256818" roughness={0.8} />
      </instancedMesh>


      {/* Bushes */}
      <instancedMesh ref={bushRef} args={[undefined, undefined, bushCount]} castShadow={false} receiveShadow={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#2a6b1c" roughness={0.85} flatShading />
      </instancedMesh>
    </group>
  );
}

// Animated grass patches that sway in wind
export function GrassPatches() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const isMobile = useIsMobile();
  const count = isMobile ? 420 : 900;
  const basePositions = useRef<Float32Array>(new Float32Array(count * 3));

  useEffect(() => {
    if (!ref.current) return;
    const maxZ = getVillageMaxZ();

    for (let i = 0; i < count; i++) {
      const [tx, tz] = getScatteredPosition(maxZ, 46);
      const ty = getTerrainHeight(tx, tz);

      basePositions.current[i * 3] = tx;
      basePositions.current[i * 3 + 1] = ty;
      basePositions.current[i * 3 + 2] = tz;

      dummy.position.set(tx, ty + 0.12, tz);
      dummy.rotation.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.15);
      dummy.scale.set(0.08 + Math.random() * 0.18, 0.3 + Math.random() * 0.6, 0.08 + Math.random() * 0.18);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, isMobile]);


  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[0.06, 0.5, 0.06]} />
      <meshStandardMaterial color="#5aad35" roughness={0.7} />
    </instancedMesh>
  );
}

// Flower patches near the village — multiple color groups
function FlowerGroup({ color, count }: { color: string; count: number }) {
  const centerRef = useRef<THREE.InstancedMesh>(null);
  const petalRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);

  const petalsPerFlower = 5;

  useEffect(() => {
    if (!centerRef.current || !petalRef.current || !stemRef.current) return;
    const maxZ = getVillageMaxZ();

    for (let i = 0; i < count; i++) {
      const [tx, tz] = getNearVillagePosition(maxZ);
      const ty = getTerrainHeight(tx, tz);

      // Stem
      dummy.position.set(tx, ty + 0.3, tz);
      dummy.scale.set(1, 0.6, 1);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.updateMatrix();
      stemRef.current.setMatrixAt(i, dummy.matrix);

      // Center
      dummy.position.set(tx, ty + 0.65, tz);
      dummy.scale.set(0.25, 0.25, 0.25);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      centerRef.current.setMatrixAt(i, dummy.matrix);

      // Petals in circle
      for (let p = 0; p < petalsPerFlower; p++) {
        const angle = (p / petalsPerFlower) * Math.PI * 2;
        const petalRadius = 0.28;

        dummy.position.set(tx + Math.cos(angle) * petalRadius, ty + 0.65, tz + Math.sin(angle) * petalRadius);
        dummy.scale.set(0.4, 0.18, 0.25);
        dummy.rotation.set(0, -angle + Math.PI, 0);
        dummy.updateMatrix();
        petalRef.current.setMatrixAt(i * petalsPerFlower + p, dummy.matrix);
      }
    }

    centerRef.current.instanceMatrix.needsUpdate = true;
    petalRef.current.instanceMatrix.needsUpdate = true;
    stemRef.current.instanceMatrix.needsUpdate = true;
  }, [count, color]);

  return (
    <>
      <instancedMesh ref={stemRef} args={[undefined, undefined, count]} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
        <meshStandardMaterial color="#228B22" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={centerRef} args={[undefined, undefined, count]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#FFCC00" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={petalRef} args={[undefined, undefined, count * petalsPerFlower]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </instancedMesh>
    </>
  );
}

export function FlowerPatches() {
  const isMobile = useIsMobile();
  const flowerColors = ['#FFD700', '#E04850', '#E080CC', '#6666E6', '#FFFFFF', '#FF9933'];
  const perColor = isMobile ? 12 : 25;

  return (
    <group>
      {flowerColors.map((c, i) => (
        <FlowerGroup key={i} color={c} count={perColor} />
      ))}
    </group>
  );
}

// Combine everything
export const Trees = () => (
  <>
    <Forest />
    <Rocks />
    <GrassPatches />
    <FlowerPatches />
  </>
);
