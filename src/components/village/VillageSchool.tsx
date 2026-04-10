import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVillageStore } from '@/store/villageStore';
import { useWallTexture, useRoofTexture, useStoneTexture, useWoodTexture } from './ProceduralTextures';
import { getTerrainHeight } from '@/utils/terrainUtils';

const _tempColor = new THREE.Color();
const _nightGlowColor = new THREE.Color('#ffcc55');

export function VillageSchool({ position }: { position: [number, number, number] }) {
  const store = useVillageStore();
  const wallTex = useWallTexture();
  const roofTex = useRoofTexture();
  const stoneTex = useStoneTexture();
  const woodTex = useWoodTexture();
  
  const meshRef = useRef<THREE.Group>(null);
  const flagRef = useRef<THREE.Mesh>(null);
  const buildingRef = useRef<THREE.Mesh>(null);

  const [x, , z] = position;
  const y = useMemo(() => getTerrainHeight(x, z), [x, z]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const timeOfDay = store.timeOfDay;
    const isNight = timeOfDay < 0.25 || timeOfDay > 0.75;

    // Subtle night glow for windows
    if (buildingRef.current && Array.isArray(buildingRef.current.material)) {
      const frontMat = buildingRef.current.material[4] as THREE.MeshStandardMaterial; // Front
      const backMat = buildingRef.current.material[5] as THREE.MeshStandardMaterial; // Back
      
      if (frontMat) {
        frontMat.emissive = isNight ? _nightGlowColor : new THREE.Color('#000000');
        frontMat.emissiveIntensity = isNight ? 0.6 : 0;
      }
      if (backMat) {
        backMat.emissive = isNight ? _nightGlowColor : new THREE.Color('#000000');
        backMat.emissiveIntensity = isNight ? 0.6 : 0;
      }
    }

    // Flag waving animation
    if (flagRef.current) {
      flagRef.current.rotation.z = Math.sin(time * 2) * 0.1;
      flagRef.current.position.y = 8 + Math.sin(time * 4) * 0.05;
    }
  });

  const handlePointerOver = (e: THREE.Event) => {
    (e as any).stopPropagation();
    store.setHoveredObject('Agrilogy Primary School');
  };

  const handlePointerOut = () => {
    store.setHoveredObject(null);
  };

  const handleClick = (e: THREE.Event) => {
    (e as any).stopPropagation();
    store.setShowSchool(true);
  };

  return (
    <group position={[x, y, z]} ref={meshRef}>
      {/* Foundation */}
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[12, 0.4, 8]} />
        <meshStandardMaterial map={stoneTex} color="#aaaaaa" />
      </mesh>

      {/* Main Building */}
      <mesh 
        position={[0, 2.5, 0]} 
        castShadow 
        receiveShadow 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        ref={buildingRef}
      >
        <boxGeometry args={[10, 5, 6]} />
        {/* Multi-material for building: [Right, Left, Top, Bottom, Front, Back] */}
        <meshStandardMaterial attach="material-0" map={wallTex} color="#f2e8cf" />
        <meshStandardMaterial attach="material-1" map={wallTex} color="#f2e8cf" />
        <meshStandardMaterial attach="material-2" map={wallTex} color="#f2e8cf" />
        <meshStandardMaterial attach="material-3" map={wallTex} color="#f2e8cf" />
        <meshStandardMaterial attach="material-4" map={wallTex} color="#f2e8cf" />
        <meshStandardMaterial attach="material-5" map={wallTex} color="#f2e8cf" />
      </mesh>

      {/* Roof - Gabled */}
      <mesh position={[0, 5.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0, 4.5, 10.5, 4]} />
        <meshStandardMaterial map={roofTex} color="#bc4749" />
      </mesh>

      {/* Entrance Portico */}
      <group position={[0, 0, 3.5]}>
        <mesh position={[0, 1.5, 0.5]} castShadow>
          <boxGeometry args={[4, 3, 1]} />
          <meshStandardMaterial map={wallTex} color="#f2e8cf" />
        </mesh>
        <mesh position={[0, 3.2, 0.5]} rotation={[0, Math.PI/2, 0]}>
           <cylinderGeometry args={[0, 1.5, 4.2, 4]} />
           <meshStandardMaterial map={roofTex} color="#bc4749" />
        </mesh>
        {/* Columns */}
        <mesh position={[-1.5, 1, 1.2]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 2, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[1.5, 1, 1.2]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 2, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* School Sign */}
      <group position={[0, 3.8, 4.1]}>
        <mesh castShadow>
          <boxGeometry args={[3, 0.8, 0.1]} />
          <meshStandardMaterial color="#386641" />
        </mesh>
        {/* Text would go here, simulated by a light stripe */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.5, 0.4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Flagpole */}
      <group position={[-4, 0, 4]}>
        <mesh position={[0, 4, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.1, 8, 8]} />
          <meshStandardMaterial color="#dddddd" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Flag */}
        <mesh position={[0.6, 7.5, 0]} ref={flagRef} castShadow>
          <planeGeometry args={[1.2, 0.8]} />
          <meshStandardMaterial color="#ff9900" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Playground area */}
      <group position={[8, 0, 0]}>
         {/* Slide */}
         <group position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
            <mesh position={[0, 1, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
               <boxGeometry args={[1, 4, 0.1]} />
               <meshStandardMaterial color="#386641" />
            </mesh>
            <mesh position={[0, 1, -1.4]} castShadow>
               <boxGeometry args={[1.2, 2, 0.1]} />
               <meshStandardMaterial color="#6a994e" />
            </mesh>
            <mesh position={[0, 2, -1.4]} >
               <cylinderGeometry args={[0.1, 0.1, 4, 8]} />
               <meshStandardMaterial color="#ffffff" />
            </mesh>
         </group>

         {/* Swings */}
         <group position={[0, 0, 4]}>
            <mesh position={[0, 2, 0]}>
               <boxGeometry args={[0.1, 4, 0.1]} />
               <meshStandardMaterial color="#444444" />
            </mesh>
            <mesh position={[3, 2, 0]}>
               <boxGeometry args={[0.1, 4, 0.1]} />
               <meshStandardMaterial color="#444444" />
            </mesh>
            <mesh position={[1.5, 4, 0]} rotation={[0, 0, Math.PI/2]}>
               <cylinderGeometry args={[0.05, 0.05, 3.2, 8]} />
               <meshStandardMaterial color="#444444" />
            </mesh>
            {/* Swing Seat */}
            <mesh position={[1.5, 1, 0]} castShadow>
               <boxGeometry args={[1, 0.1, 0.5]} />
               <meshStandardMaterial color="#bc4749" />
            </mesh>
         </group>
      </group>

      {/* Fence around school */}
      <group position={[0,0,0]}>
        {/* Small garden/fence detail could go here */}
      </group>
    </group>
  );
}
