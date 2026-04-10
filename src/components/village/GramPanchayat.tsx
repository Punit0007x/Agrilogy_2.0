import { useVillageStore } from '@/store/villageStore';
import { useStoneTexture, useWallTexture, useRoofTexture } from './ProceduralTextures';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { WeatherStation, SmartGateController } from '@/components/village/IoTDevices';
import { useIsMobile } from '@/hooks/use-mobile';

const _tempColor = new THREE.Color();
const _nightWinColor = new THREE.Color("#1a1a1a");
const _dayWinColor = new THREE.Color("#ffe082");

function GramPanchayat(props: JSX.IntrinsicElements['group']) {
  const store = useVillageStore();
  const timeOfDay = store.timeOfDay;
  const isHovered = store.hoveredObject === 'panchayat';
  const stoneTex = useStoneTexture();
  const wallTex = useWallTexture();
  const roofTex = useRoofTexture();
  const flagRef = useRef<THREE.Group>(null);
  const lightsRef = useRef<THREE.Group>(null);
  const isMobile = useIsMobile();

  // Animations & Lighting
  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#1a1a1a", 
    emissive: "#ffcc44", 
    emissiveIntensity: 0 
  }), []);

  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#3e2723", 
    emissive: "#ffaa44", 
    emissiveIntensity: 0 
  }), []);

  useFrame((state) => {
    const ts = store.timeOfDay;
    // Smooth transition logic
    let nightFactor = 0;
    if (ts < 0.25 || ts > 0.75) nightFactor = 1;
    else if (ts >= 0.25 && ts < 0.3) nightFactor = 1 - (ts - 0.25) / 0.05;
    else if (ts > 0.7 && ts <= 0.75) nightFactor = (ts - 0.7) / 0.05;

    if (lightsRef.current) {
      lightsRef.current.children.forEach((light) => {
        const pointLight = light as THREE.PointLight;
        if (pointLight.isPointLight) pointLight.intensity = nightFactor * 1.5;
      });
    }
    
    // Update shared materials
    windowMaterial.emissiveIntensity = nightFactor * 1.2;
    windowMaterial.color.copy(_nightWinColor).lerp(_dayWinColor, nightFactor);
    doorMat.emissiveIntensity = nightFactor * 0.25;

    if (!isMobile && flagRef.current) {
      flagRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
      flagRef.current.position.y = 7.7 + Math.sin(state.clock.getElapsedTime() * 5) * 0.05;
    }
  });

  return (
    <group
      {...props}
      onPointerEnter={(e) => { e.stopPropagation(); store.setHoveredObject('panchayat'); }}
      onPointerLeave={(e) => { e.stopPropagation(); store.setHoveredObject(null); }}
      onClick={(e) => { e.stopPropagation(); store.setShowPanchayat(true); }}
    >
      {/* Night Lights */}
      <group ref={lightsRef}>
        <pointLight position={[0, 4, 4]} intensity={0} color="#ffaa44" distance={15} decay={2} />
        <pointLight position={[-6, 3, 3]} intensity={0} color="#ff9944" distance={10} decay={2} />
        <pointLight position={[6, 3, 3]} intensity={0} color="#ff9944" distance={10} decay={2} />
      </group>

      {/* 1. Gram Panchayat Campus Foundation */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[20, 0.4, 16]} />
        <meshStandardMaterial map={stoneTex} roughness={0.9} color={isHovered ? "#e0e0e0" : "#ffffff"} />
      </mesh>

      {/* Connecting Driveway to the road */}
      <mesh position={[5, 0.05, 9]} receiveShadow>
        <boxGeometry args={[10, 0.1, 3]} />
        <meshStandardMaterial map={stoneTex} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 9]} receiveShadow>
        <boxGeometry args={[3, 0.1, 3]} />
        <meshStandardMaterial map={stoneTex} roughness={0.9} />
      </mesh>
      
      {/* Main Building Base Platform */}
      <mesh position={[0, 0.6, -2]} receiveShadow castShadow>
        <boxGeometry args={[14, 0.4, 8]} />
        <meshStandardMaterial map={stoneTex} roughness={0.8} />
      </mesh>

      {/* Entry Steps */}
      {[0, 1, 2].map((step) => (
        <mesh key={step} position={[0, 0.5 + step * 0.15, 2 + step * -0.2]}>
          <boxGeometry args={[4, 0.15, 0.4]} />
          <meshStandardMaterial map={stoneTex} roughness={0.8} />
        </mesh>
      ))}

      {/* 2. Main Building Architecture */}
      <group position={[0, 0.8, -2]}>
        {/* Central Hall Floor */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 3, 6]} />
          <meshStandardMaterial color={isHovered ? '#fff3e0' : '#fdf5e6'} roughness={0.7} map={wallTex} />
        </mesh>

        {/* Left Wing */}
        <mesh position={[-5.5, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 2.5, 5]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.7} map={wallTex} />
        </mesh>
        
        {/* Right Wing */}
        <mesh position={[5.5, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 2.5, 5]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.7} map={wallTex} />
        </mesh>

        {/* Main Roof (Dome/Sloped pattern) */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <coneGeometry args={[5, 2, 4]} />
          <meshStandardMaterial color="#c05a3c" roughness={0.8} map={roofTex} />
        </mesh>
        <mesh position={[0, 4.8, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Wing Roofs */}
        <mesh position={[-5.5, 3.1, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3, 1.2, 4]} />
          <meshStandardMaterial color="#c05a3c" roughness={0.8} map={roofTex} />
        </mesh>
        <mesh position={[5.5, 3.1, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3, 1.2, 4]} />
          <meshStandardMaterial color="#c05a3c" roughness={0.8} map={roofTex} />
        </mesh>

        {/* Front Pillars and Veranda */}
        {[-3.5, -1.5, 1.5, 3.5].map((x, i) => (
          <group key={`pillar-${i}`} position={[x, 1.5, 3.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.25, 3, 8]} />
              <meshStandardMaterial color="#d2b48c" roughness={0.6} map={wallTex} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[0.6, 0.2, 0.6]} />
              <meshStandardMaterial color="#8b5a2b" />
            </mesh>
          </group>
        ))}

        {/* Veranda Roof Overlay */}
        <mesh position={[0, 3.1, 3.2]} castShadow>
          <boxGeometry args={[8.5, 0.3, 1.5]} />
          <meshStandardMaterial color="#8b4513" map={roofTex} />
        </mesh>

        {/* Main Arched Entrance */}
        <mesh position={[0, 1.2, 3.01]} material={doorMat}>
          <planeGeometry args={[2, 2.5]} />
        </mesh>
        <mesh position={[0, 2.45, 3.01]} material={doorMat}>
          <circleGeometry args={[1, 32, 0, Math.PI]} />
        </mesh>

        {/* Windows */}
        {[-2.5, 2.5, -5.5, 5.5].map((x) => (
          <group key={`win-${x}`} position={[x, 1.5, x === -5.5 || x === 5.5 ? 2.51 : 3.01]}>
            <mesh material={windowMaterial}>
              <planeGeometry args={[1, 1.5]} />
            </mesh>
            <mesh position={[0, 0.75, 0]} material={windowMaterial}>
              <circleGeometry args={[0.5, 16, 0, Math.PI]} />
            </mesh>
            {/* Window Bars */}
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[0.05, 1.5, 0.02]} />
              <meshStandardMaterial color="#000" />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[1, 0.05, 0.02]} />
              <meshStandardMaterial color="#000" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. National Flag & Pole */}
      <group position={[7, 0.4, 5]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.6, 0.8, 0.4, 16]} /><meshStandardMaterial map={stoneTex} /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.4, 0.6, 0.3, 16]} /><meshStandardMaterial map={stoneTex} /></mesh>
        <mesh position={[0, 4, 0]}><cylinderGeometry args={[0.05, 0.08, 7.5, 8]} /><meshStandardMaterial color="#b0b0b0" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, 7.8, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} /></mesh>
        <group ref={flagRef} position={[0.9, 7.7, 0]}>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[1.8, 0.3, 0.02]} /><meshStandardMaterial color="#FF9933" /></mesh>
          <mesh position={[0, 0, 0]}><boxGeometry args={[1.8, 0.3, 0.02]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          <mesh position={[0, -0.3, 0]}><boxGeometry args={[1.8, 0.3, 0.02]} /><meshStandardMaterial color="#138808" /></mesh>
          <mesh position={[0, 0, 0.015]}><circleGeometry args={[0.12, 16]} /><meshStandardMaterial color="#000080" /></mesh>
          <mesh position={[0, 0, -0.015]}><circleGeometry args={[0.12, 16]} /><meshStandardMaterial color="#000080" /></mesh>
        </group>
      </group>

      {/* 4. Gram Panchayat Sign Board */}
      <group position={[0, 5.5, -1]}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[5.5, 1, 0.2]} /><meshStandardMaterial color="#1a472a" /></mesh>
        <mesh position={[0, 0, 0.11]}><boxGeometry args={[5.3, 0.8, 0.05]} /><meshStandardMaterial color="#ffcc00" /></mesh>
        <Text position={[0, 0, 0.15]} fontSize={0.4} color="#1a472a" anchorX="center" anchorY="middle" maxWidth={5} textAlign="center">PANCHAYAT OFFICE</Text>
      </group>

      {/* Panchayat Katte (Platform/Bench near entrance) */}
      <group position={[0, 0.3, 5]}>
        {/* Main platform - stone bench */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 0.6, 2]} />
          <meshStandardMaterial map={stoneTex} color="#c0b0a0" roughness={0.85} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.8, -0.8]} castShadow>
          <boxGeometry args={[8, 1, 0.3]} />
          <meshStandardMaterial map={stoneTex} color="#c0b0a0" roughness={0.85} />
        </mesh>
        {/* Support pillars */}
        {[-3.5, 3.5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.7]} castShadow>
            <boxGeometry args={[0.4, 0.6, 0.4]} />
            <meshStandardMaterial map={stoneTex} color="#a09080" roughness={0.9} />
          </mesh>
        ))}
        {/* Decorative top pillar caps */}
        {[-3.5, 3.5].map((x, i) => (
          <mesh key={`cap-${i}`} position={[x, 0.35, 0.7]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial map={stoneTex} color="#d0c0b0" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* 5. The Choupal (Village Gathering Tree) */}
      <group position={[-5, 0.4, 5]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[2.5, 2.5, 0.4, 32]} /><meshStandardMaterial map={stoneTex} color="#d4c4b7" /></mesh>
        <mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.4, 0.6, 4, 8]} /><meshStandardMaterial color="#4a3b2c" roughness={0.9} /></mesh>
        {[0, 1, 2].map((layer) => (
          <mesh key={layer} position={[0, 4.5 + layer * 1.5, 0]} castShadow><sphereGeometry args={[2.8 - layer * 0.5, 8, 8]} /><meshStandardMaterial color="#2e5c2e" roughness={0.8} /></mesh>
        ))}
      </group>

      {/* 6. Compound Wall & Entrance Gate */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1, -7.8]}><boxGeometry args={[19.6, 1.6, 0.4]} /><meshStandardMaterial map={stoneTex} /></mesh>
        <mesh position={[-9.8, 1, 0]}><boxGeometry args={[0.4, 1.6, 16]} /><meshStandardMaterial map={stoneTex} /></mesh>
        <mesh position={[9.8, 1, 0]}><boxGeometry args={[0.4, 1.6, 16]} /><meshStandardMaterial map={stoneTex} /></mesh>
        <mesh position={[-6.4, 1, 7.8]}><boxGeometry args={[7.2, 1.6, 0.4]} /><meshStandardMaterial map={stoneTex} /></mesh>
        <mesh position={[6.4, 1, 7.8]}><boxGeometry args={[7.2, 1.6, 0.4]} /><meshStandardMaterial map={stoneTex} /></mesh>

        <group position={[0, 0, 7.8]}>
          <mesh position={[-2.5, 2, 0]}><boxGeometry args={[0.6, 4, 0.6]} /><meshStandardMaterial map={wallTex} color="#f5e6d3" /></mesh>
          <mesh position={[2.5, 2, 0]}><boxGeometry args={[0.6, 4, 0.6]} /><meshStandardMaterial map={wallTex} color="#f5e6d3" /></mesh>
          <mesh position={[0, 4.2, 0]}><boxGeometry args={[5.6, 0.4, 0.6]} /><meshStandardMaterial map={wallTex} color="#c05a3c" /></mesh>
          <mesh position={[0, 4.8, 0]}><boxGeometry args={[2, 0.8, 0.6]} /><meshStandardMaterial map={wallTex} color="#f5e6d3" /></mesh>
          <mesh position={[0, 5.2, 0]} rotation={[0, Math.PI/4, 0]}>
            <coneGeometry args={[1.5, 1, 4]} />
            <meshStandardMaterial map={roofTex} color="#c05a3c" />
          </mesh>
          <SmartGateController position={[-3, 0.1, 0.5]} />
          <SmartGateController position={[3, 0.1, 0.5]} />
        </group>
      </group>

      {/* 7. Central Weather & IoT Hub */}
      <WeatherStation position={[7, 0.4, -4]} />
    </group>
  );
}

export default GramPanchayat;
